'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AvatarStage } from './avatar/AvatarStage';
import { AmbientFx } from './chrome/AmbientFx';
import { publicConfig } from './chat-config';
import styles from './chat-shell.module.css';
import type { AvatarState, ChatMessage, PresenceState } from './chat-types';
import { cn, makeId } from './chat-utils';

const nowIso = () => new Date().toISOString();

export function ChatShell() {
  const { appName, assistantName } = publicConfig;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content: `${assistantName} online. Direct gateway link stable. You can speak now.`,
      createdAt: nowIso()
    }
  ]);
  const [draft, setDraft] = useState('');
  const [presence, setPresence] = useState<PresenceState>('idle');
  const [statusText, setStatusText] = useState(`${assistantName} is idle`);
  const [error, setError] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const assistantBufferRef = useRef('');

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setPointer({ x, y });
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const avatarState: AvatarState = useMemo(() => {
    if (presence === 'typing') return 'speaking';
    if (presence === 'processing') return 'thinking';
    if (presence === 'error') return 'error';
    if (isFocused || Boolean(draft.trim())) return 'listening';
    return 'idle';
  }, [draft, isFocused, presence]);

  const pointerStyle = {
    '--look-x': `${pointer.x * 18}px`,
    '--look-y': `${pointer.y * 14}px`,
    '--tilt-x': `${pointer.y * -7}deg`,
    '--tilt-y': `${pointer.x * 9}deg`
  } as CSSProperties;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
      createdAt: nowIso()
    };

    const assistantMessageId = makeId();
    assistantBufferRef.current = '';
    setError(null);
    setDraft('');
    setPresence('processing');
    setStatusText(`${assistantName} is processing`);
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantMessageId, role: 'assistant', content: '', createdAt: nowIso() }
    ]);

    try {
      const response = await fetch(`${publicConfig.gatewayUrl}${publicConfig.chatPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicConfig.gatewayToken}`
        },
        body: JSON.stringify({
          model: 'openclaw',
          stream: true,
          messages: [
            ...messages
              .filter((message) => message.role === 'user' || message.role === 'assistant')
              .map((message) => ({ role: message.role, content: message.content })),
            { role: 'user', content }
          ]
        })
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || 'Failed to connect to gateway');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          const line = chunk.split('\n').find((entry) => entry.startsWith('data:'));
          if (!line) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          if (raw === '[DONE]') {
            setPresence('idle');
            setStatusText(`${assistantName} is idle`);
            continue;
          }

          const json = JSON.parse(raw) as {
            choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
          };

          const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content;
          if (delta) {
            setPresence('typing');
            setStatusText(`${assistantName} is speaking`);
            assistantBufferRef.current += delta;
            const text = assistantBufferRef.current;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId ? { ...message, content: text } : message
              )
            );
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPresence('error');
      setStatusText('Connection issue');
      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? { ...item, content: `Sorry - the gateway request failed.\n\n${message}` }
            : item
        )
      );
    }
  }

  return (
    <div className={styles.shell}>
      <AmbientFx />

      <main className={styles.frame}>
        <section className={styles.scene}>
          <AvatarStage
            appName={appName}
            assistantName={assistantName}
            avatarState={avatarState}
            statusText={statusText}
            pointerStyle={pointerStyle}
          />

          <div className={styles.sceneTint} />

          <section className={styles.chatDock}>
            <header className={styles.consoleHeader}>
              <div className={styles.identityBlock}>
                <div className={styles.panelEyebrow}>Synthetic relay interface</div>
                <h1 className={styles.consoleTitle}>{assistantName}</h1>
                <p className={styles.consoleCopy}>
                  A direct conversation surface anchored to the live gateway, wrapped in a quiet,
                  high-voltage sci-fi shell.
                </p>
              </div>

              <div className={styles.statusCluster}>
                <div className={styles.statusPill} aria-live="polite">
                  <span
                    className={cn(
                      styles.statusDot,
                      presence === 'idle' && styles.presenceIdle,
                      presence === 'processing' && styles.presenceProcessing,
                      presence === 'typing' && styles.presenceTyping,
                      presence === 'error' && styles.presenceError
                    )}
                  />
                  <span>{statusText}</span>
                </div>
                <div className={styles.modePill}>{avatarState}</div>
              </div>
            </header>

            <div className={styles.chatColumn}>
              <div className={styles.messages} aria-live="polite" aria-busy={presence !== 'idle'}>
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={cn(
                      styles.message,
                      message.role === 'user' ? styles.user : styles.assistant
                    )}
                  >
                    <div className={styles.messageMeta}>
                      {message.role === 'user' ? 'Operator' : assistantName}
                    </div>
                    {message.content || (
                      <div className={styles.typing}>
                        <span />
                        <span />
                        <span />
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className={styles.composerWrap}>
                <form className={styles.form} onSubmit={onSubmit}>
                  <textarea
                    className={styles.input}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={`Transmit to ${assistantName}...`}
                  />

                  <div className={styles.actions}>
                    <div className={styles.helper}>
                      {error ? `Last error: ${error}` : 'Direct browser to gateway path'}
                    </div>
                    <div className={styles.consoleTags}>
                      <span className={styles.consoleTag}>{appName}</span>
                      <span className={styles.consoleTag}>browser to gateway</span>
                    </div>
                    <button
                      className={styles.button}
                      type="submit"
                      disabled={!draft.trim() || presence === 'processing' || presence === 'typing'}
                    >
                      Transmit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
