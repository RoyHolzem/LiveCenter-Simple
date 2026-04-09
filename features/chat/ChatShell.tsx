'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { publicConfig } from './chat-config';
import styles from './chat-shell.module.css';
import type { AvatarState, ChatMessage, PresenceState } from './chat-types';
import { cn, makeId } from './chat-utils';

const nowIso = () => new Date().toISOString();

export function ChatShell() {
  const { appName, assistantName } = publicConfig;
  const assistantInitial = assistantName.charAt(0).toUpperCase();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content: `Hello. I'm ${assistantName}, your AI assistant. How can I help you today?`,
      createdAt: nowIso()
    }
  ]);
  const [draft, setDraft] = useState('');
  const [presence, setPresence] = useState<PresenceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const assistantBufferRef = useRef('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  }, [draft]);

  const avatarState: AvatarState = useMemo(() => {
    if (presence === 'typing') return 'speaking';
    if (presence === 'processing') return 'thinking';
    if (presence === 'error') return 'error';
    if (isFocused || Boolean(draft.trim())) return 'listening';
    return 'idle';
  }, [draft, isFocused, presence]);

  const statusLabel = useMemo(() => {
    switch (avatarState) {
      case 'speaking': return 'Responding';
      case 'thinking': return 'Thinking';
      case 'listening': return 'Listening';
      case 'error': return 'Error';
      default: return 'Online';
    }
  }, [avatarState]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || presence === 'processing' || presence === 'typing') return;

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
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((m) => ({ role: m.role, content: m.content })),
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
          if (!raw || raw === '[DONE]') {
            setPresence('idle');
            continue;
          }

          const json = JSON.parse(raw) as {
            choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
          };

          const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content;
          if (delta) {
            setPresence('typing');
            assistantBufferRef.current += delta;
            const text = assistantBufferRef.current;
            setMessages((current) =>
              current.map((m) =>
                m.id === assistantMessageId ? { ...m, content: text } : m
              )
            );
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPresence('error');
      setError(message);
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: `I encountered an error. Please try again.\n\n${message}` }
            : m
        )
      );
    }
  }, [draft, messages, presence]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  }, []);

  return (
    <div className={styles.shell}>
      {/* ─── Sidebar ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <div className={styles.sidebarTitle}>{appName}</div>
          <div className={styles.sidebarSub}>AI Assistant Interface</div>
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatarCircle}>{assistantInitial}</div>
            <div className={cn(styles.statusRing, styles[avatarState])} />
            <div className={cn(styles.statusIndicator, styles[avatarState])} />
          </div>
          <div className={styles.avatarName}>{assistantName}</div>
          <div className={cn(styles.statusBadge, styles[avatarState])}>
            <span className={styles.badgeDot} />
            {statusLabel}
          </div>
        </div>

        <div className={styles.sessionInfo}>
          <div className={styles.sessionLabel}>Session</div>
          <div className={styles.sessionMeta}>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Model</span>
              <span className={styles.metaVal}>OpenClaw</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Messages</span>
              <span className={styles.metaVal}>{messages.length}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaKey}>Status</span>
              <span className={styles.metaVal}>{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <span className={styles.footerDot} />
          Gateway connected
        </div>
      </aside>

      {/* ─── Main Chat ─── */}
      <main className={styles.main}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.chatHeaderAvatar}>{assistantInitial}</div>
            <div className={styles.chatHeaderInfo}>
              <h2>{assistantName}</h2>
              <p>AI Assistant</p>
            </div>
          </div>
          <div className={styles.headerStatus}>
            <span className={cn(styles.headerStatusDot, styles[avatarState])} />
            {statusLabel}
          </div>
        </div>

        <div className={styles.messages} role="log" aria-live="polite">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(styles.message, styles[message.role])}
            >
              <div className={styles.msgAvatar}>
                {message.role === 'user' ? 'U' : assistantInitial}
              </div>
              <div className={styles.msgContent}>
                <div className={styles.msgRole}>
                  {message.role === 'user' ? 'You' : assistantName}
                </div>
                <div className={styles.msgBubble}>
                  {message.content || (
                    <div className={styles.typing}>
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.composer}>
          <div className={styles.composerInner}>
            {error && (
              <div className={cn(styles.errorBanner, styles.visible)}>{error}</div>
            )}
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputWrap}>
                <textarea
                  ref={textareaRef}
                  className={styles.input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${assistantName}...`}
                  rows={1}
                />
                <div className={styles.inputActions}>
                  <span className={styles.inputHint}>
                    Shift+Enter for new line
                  </span>
                  <button
                    className={styles.button}
                    type="submit"
                    disabled={!draft.trim() || presence === 'processing' || presence === 'typing'}
                  >
                    Send
                    <span className={styles.buttonIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
