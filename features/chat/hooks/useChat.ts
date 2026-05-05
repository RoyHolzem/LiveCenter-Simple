'use client';

/**
 * OpenClaw / gateway may inject SSE `data:` JSON lines alongside token deltas:
 * - Focus telecom row: `{ "type": "telecom_focus", "view": "incidents"|"events"|"planned-works", "recordId": "<id>", "label"?: "<optional>" }`
 * - Ops-style action: `{ "type": "action", ... }` (see XenaActionEvent in @/lib/types)
 */

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AvatarState, ChatMessage, PresenceState, XenaActionEvent, XenaTelecomFocusEvent } from '@/lib/types';
import { makeId } from '../chat-utils';
import { parseSseDataObject } from '../sse-parse';

const nowIso = () => new Date().toISOString();

export type UseChatOptions = {
  onXenaAction?: (event: XenaActionEvent) => void;
  onTelecomFocus?: (event: XenaTelecomFocusEvent) => void;
};

export function useChat(selectedModel: string = 'inceptionlabs/mercury-2', options?: UseChatOptions) {
  const onXenaAction = options?.onXenaAction;
  const onTelecomFocus = options?.onTelecomFocus;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content: 'Hi Roy. I pulled in the Luxembourg telecom tables and I can help you inspect or explain anything you see here.',
      createdAt: nowIso(),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [presence, setPresence] = useState<PresenceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Model fallback tracking
  const [modelFallback, setModelFallback] = useState<{
    requested: string;
    actual?: string;
    fellBack: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const assistantBufferRef = useRef('');
  const voiceAssistantMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // ─── Voice message helpers ───

  const addVoiceUserMessage = useCallback((transcript: string) => {
    const msg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: transcript,
      createdAt: nowIso(),
      source: 'voice',
    };
    setMessages((current) => [...current, msg]);
  }, []);

  const ensureVoiceAssistantMessage = useCallback(() => {
    if (voiceAssistantMsgIdRef.current) return;
    const id = makeId();
    voiceAssistantMsgIdRef.current = id;
    assistantBufferRef.current = '';
    setMessages((current) => [
      ...current,
      { id, role: 'assistant', content: '', createdAt: nowIso(), source: 'voice' },
    ]);
  }, []);

  const appendVoiceAssistantDelta = useCallback((delta: string) => {
    ensureVoiceAssistantMessage();
    assistantBufferRef.current += delta;
    const text = assistantBufferRef.current;
    const msgId = voiceAssistantMsgIdRef.current;
    if (!msgId) return;
    setMessages((current) =>
      current.map((m) => (m.id === msgId ? { ...m, content: text } : m))
    );
  }, [ensureVoiceAssistantMessage]);

  const resetVoiceAssistant = useCallback(() => {
    voiceAssistantMsgIdRef.current = null;
    assistantBufferRef.current = '';
  }, []);

  // ─── Text chat submit ───

  const handleSubmit = useCallback(async (
    event: FormEvent<HTMLFormElement>,
    getAuthToken: () => Promise<string | null>,
  ) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || presence === 'processing' || presence === 'typing') return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content, createdAt: nowIso() };
    const assistantMessageId = makeId();
    assistantBufferRef.current = '';
    setError(null);
    setModelFallback(null); // Reset fallback state for new message
    setDraft('');
    setPresence('processing');

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantMessageId, role: 'assistant', content: '', createdAt: nowIso() },
    ]);

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'openclaw/operator',
          model_override: selectedModel,
          stream: true,
          messages: [
            ...messages
              .filter((message) => message.role === 'user' || message.role === 'assistant')
              .map((message) => ({ role: message.role, content: message.content })),
            { role: 'user', content },
          ],
        }),
      });

      // Check for model fallback from response headers
      const requestedModel = response.headers.get('x-requested-model') || selectedModel;
      const actualModel = response.headers.get('x-actual-model') || '';
      if (actualModel && actualModel !== requestedModel) {
        setModelFallback({ requested: requestedModel, actual: actualModel, fellBack: true });
        console.warn(`[chat] Model fallback: requested=${requestedModel}, actual=${actualModel}`);
      }

      if (!response.ok || !response.body) {
        const text = await response.text();
        // Try to parse error body for model info
        let errorData: any = {};
        try { errorData = JSON.parse(text); } catch { /* not JSON */ }

        // If the error includes requested_model, surface it
        const errMsg = errorData.error || text || `Server error ${response.status}`;
        const modelCtx = errorData.requested_model
          ? ` (model: ${errorData.requested_model})`
          : '';
        throw new Error(errMsg + modelCtx);
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

          try {
            const parsed = JSON.parse(raw);
            const line = parseSseDataObject(parsed);
            if (line.kind === 'telecom_focus') {
              onTelecomFocus?.(line.event);
              continue;
            }
            if (line.kind === 'action') {
              onXenaAction?.(line.event);
              continue;
            }
            if (line.kind === 'delta') {
              setPresence('typing');
              assistantBufferRef.current += line.text;
              const text = assistantBufferRef.current;
              setMessages((current) => current.map((message) => (
                message.id === assistantMessageId ? { ...message, content: text } : message
              )));
            }
          } catch {
            // ignore non-json chunks
          }
        }
      }

      setPresence('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPresence('error');
      setError(message);
      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: `I hit an error while contacting the gateway.\n\n${message}` }
            : msg
        )
      );
    }
  }, [draft, messages, presence, selectedModel, onXenaAction, onTelecomFocus]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.closest('form')?.requestSubmit();
    }
  }, []);

  return {
    messages,
    draft,
    setDraft,
    presence,
    error,
    isFocused,
    setIsFocused,
    avatarState,
    statusLabel,
    messagesEndRef,
    textareaRef,
    handleSubmit,
    handleKeyDown,
    addVoiceUserMessage,
    appendVoiceAssistantDelta,
    resetVoiceAssistant,
    modelFallback,
  };
}
