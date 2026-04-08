'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import styles from './chat-shell.module.css';
import type { ChatMessage, PresenceState } from '@/lib/types';
import { makeId } from '@/lib/utils';
import { publicConfig } from '@/lib/config';

type Props = {
  appName: string;
  assistantName: string;
};

type RobotMode = 'idle' | 'listening' | 'speaking';

const nowIso = () => new Date().toISOString();

export function ChatShell({ appName, assistantName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content: `Xena online. Direct gateway link stable. You can speak now.`,
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

  const robotMode: RobotMode = useMemo(() => {
    if (presence === 'typing') return 'speaking';
    if (presence === 'processing' || isFocused) return 'listening';
    return 'idle';
  }, [presence, isFocused]);

  const label = useMemo(() => {
    if (presence === 'processing') return `${assistantName} is processing`;
    if (presence === 'typing') return `${assistantName} is speaking`;
    if (presence === 'error') return 'Connection issue';
    return `${assistantName} is idle`;
  }, [assistantName, presence]);

  const robotStyle = {
    '--look-x': `${pointer.x * 18}px`,
    '--look-y': `${pointer.y * 14}px`,
    '--tilt-x': `${pointer.y * -9}deg`,
    '--tilt-y': `${pointer.x * 12}deg`
  } as React.CSSProperties;

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
            ? { ...item, content: `Sorry — the gateway request failed.\n\n${message}` }
            : item
        )
      );
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.noise} />
      <div className={styles.grid} />
      <div className={styles.particles} />
      <div className={styles.codeRain} />

      <main className={styles.frame}>
        <section className={styles.hero}>
          <div className={styles.leftPane}>
            <div className={styles.signalBar}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.eyebrow}>Experimental branch · pass 1 · elite blue matrix system</div>
            <h1 className={styles.heroTitle}>{appName}</h1>
            <p className={styles.heroText}>
              A cinematic AI surface built around a living machine presence — deep electric blues, black glass, and a control deck anchored to a real OpenClaw gateway.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.statPanel}>
                <div className={styles.statLabel}>Presence</div>
                <div className={styles.statValue}>{robotMode}</div>
              </div>
              <div className={styles.statPanel}>
                <div className={styles.statLabel}>Voice channel</div>
                <div className={styles.statValue}>{label.replace(`${assistantName} is `, '')}</div>
              </div>
              <div className={styles.statPanel}>
                <div className={styles.statLabel}>Path</div>
                <div className={styles.statValue}>browser → gateway</div>
              </div>
            </div>
          </div>

          <div className={styles.centerStage}>
            <div className={styles.orbitOne} />
            <div className={styles.orbitTwo} />
            <div className={styles.hudPanelTop}>
              <span className={styles.hudLabel}>Neural status</span>
              <strong>{statusText}</strong>
            </div>
            <div className={styles.hudPanelBottom}>
              <span className={styles.hudLabel}>Operator link</span>
              <strong>direct gateway mode</strong>
            </div>

            <div className={styles.robotStage} style={robotStyle}>
              <div className={styles.halo} />
              <div className={`${styles.robot} ${styles[robotMode]}`}>
                <div className={styles.robotAura} />
                <div className={styles.robotHead}>
                  <div className={styles.cranium} />
                  <div className={styles.facePlate}>
                    <div className={styles.faceSeam} />
                    <div className={styles.eyeCluster}>
                      <span className={styles.eye} />
                      <span className={styles.eyeCore} />
                    </div>
                    <div className={styles.voicePanel}>
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className={styles.templeLeft} />
                  <div className={styles.templeRight} />
                </div>
                <div className={styles.neck}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.torso}>
                  <div className={styles.collar} />
                  <div className={styles.core}>
                    <div className={styles.coreRing} />
                    <div className={styles.corePulse} />
                  </div>
                  <div className={styles.shoulderLeft} />
                  <div className={styles.shoulderRight} />
                </div>
              </div>
              <div className={styles.stageReflection} />
            </div>
          </div>
        </section>

        <section className={styles.commandDeck}>
          <div className={styles.deckHeader}>
            <div>
              <div className={styles.topTitle}>{assistantName}</div>
              <div className={styles.topSub}>Immersive control deck · direct OpenClaw link · premium experimental shell</div>
            </div>
            <div className={styles.statusBadge}>
              <span className={`${styles.dot} ${styles[presence] || ''}`} />
              {statusText}
            </div>
          </div>

          <div className={styles.deckBody}>
            <div className={styles.deckSide}>
              <div className={styles.sidePanel}>
                <div className={styles.sidePanelLabel}>Machine</div>
                <div className={styles.sidePanelValue}>{robotMode}</div>
                <p className={styles.sidePanelCopy}>Passive posture in silence. Focus shift during input. Active voice lattice during response generation.</p>
              </div>
              <div className={styles.sidePanel}>
                <div className={styles.sidePanelLabel}>Signal</div>
                <div className={styles.sidePanelValue}>stable</div>
                <p className={styles.sidePanelCopy}>The visual pass is now hero-first. Functionality remains chained to the browser-to-gateway route.</p>
              </div>
            </div>

            <div className={styles.chatColumn}>
              <div className={styles.messages}>
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`${styles.message} ${message.role === 'user' ? styles.user : styles.assistant}`}
                  >
                    <div className={styles.messageMeta}>{message.role === 'user' ? 'Operator' : assistantName}</div>
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
                    <div className={styles.helper}>{error ? `Last error: ${error}` : 'Direct browser → gateway path'}</div>
                    <button className={styles.button} type="submit" disabled={!draft.trim() || presence === 'processing' || presence === 'typing'}>
                      Transmit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
