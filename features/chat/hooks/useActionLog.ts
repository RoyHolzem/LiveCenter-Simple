'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type ActionLogEntry = {
  id: string;
  timestamp: string;
  source: 'api' | 'stream' | 'record';
  label: string;
  detail?: string;
  status: 'running' | 'done' | 'error';
  icon: string;
};

let counter = 0;
function nextId(): string { return `a-${++counter}`; }
function nowIso(): string { return new Date().toISOString(); }

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

/** Parse assistant text for API action patterns */
function parseActionsFromText(text: string): Array<{ label: string; detail?: string; icon: string }> {
  const actions: Array<{ label: string; detail?: string; icon: string }> = [];
  const lower = text.toLowerCase();

  // Record ID patterns
  const recordRe = /\b(INCIDENT-LUX-\d+|EVENT-LUX-\d+|PW-LUX-\d+|ORDER-LUX-\d+)\b/g;
  let match: RegExpExecArray | null;
  const seenRecords = new Set<string>();
  while ((match = recordRe.exec(text)) !== null) {
    const id = match[1];
    if (seenRecords.has(id)) continue;
    seenRecords.add(id);
    if (id.startsWith('INCIDENT')) actions.push({ label: 'Matched incident', detail: id, icon: '⚠' });
    else if (id.startsWith('EVENT')) actions.push({ label: 'Matched event', detail: id, icon: '⚡' });
    else if (id.startsWith('PW')) actions.push({ label: 'Matched maintenance', detail: id, icon: '⚙' });
    else if (id.startsWith('ORDER')) actions.push({ label: 'Matched order', detail: id, icon: '📦' });
  }

  // API action patterns (check these BEFORE generic GET)
  if (/(?:created|added|new|opened)\s+(?:a\s+)?(?:new\s+)?(?:incident|ticket)/i.test(lower)) {
    actions.push({ label: 'POST /incidents', detail: 'Created new incident', icon: '✏️' });
  }
  if (/(?:created|added|new)\s+(?:a\s+)?(?:new\s+)?event/i.test(lower)) {
    actions.push({ label: 'POST /events', detail: 'Created new event', icon: '✏️' });
  }
  if (/(?:updated|changed|modified|set)\s+(?:the\s+)?(?:incident|event|maintenance|order)/i.test(lower)) {
    actions.push({ label: 'PUT record update', detail: 'Updated record', icon: '📝' });
  }
  if (/(?:closed|resolved)\s+(?:the\s+)?(?:incident|event)/i.test(lower)) {
    actions.push({ label: 'PUT status → closed', detail: 'Closed record', icon: '✅' });
  }

  // Generic GET patterns
  if (/(?:fetched|retrieved|queried|listed|found|showing)\s+\d+\s+(?:open\s+)?incidents/i.test(lower)) {
    const countMatch = lower.match(/(\d+)\s+(?:open\s+)?incidents/i);
    actions.push({ label: 'GET /incidents', detail: countMatch ? `${countMatch[1]} records` : 'Fetched incidents', icon: '🔍' });
  }
  if (/(?:fetched|retrieved|queried|listed|found|showing)\s+\d+\s+(?:open\s+)?events/i.test(lower)) {
    const countMatch = lower.match(/(\d+)\s+(?:open\s+)?events/i);
    actions.push({ label: 'GET /events', detail: countMatch ? `${countMatch[1]} records` : 'Fetched events', icon: '🔍' });
  }
  if (/(?:fetched|retrieved|queried|listed|found|showing)\s+\d+\s+(?:open\s+)?(?:planned\s+works|maintenance)/i.test(lower)) {
    const countMatch = lower.match(/(\d+)\s+(?:open\s+)?(?:planned\s+works|maintenance)/i);
    actions.push({ label: 'GET /planned-works', detail: countMatch ? `${countMatch[1]} records` : 'Fetched maintenance', icon: '🔍' });
  }
  if (/(?:fetched|retrieved|queried|listed|found|showing)\s+\d+\s+(?:open\s+)?orders/i.test(lower)) {
    const countMatch = lower.match(/(\d+)\s+(?:open\s+)?orders/i);
    actions.push({ label: 'GET /orders', detail: countMatch ? `${countMatch[1]} records` : 'Fetched orders', icon: '🔍' });
  }

  return actions;
}

export function useActionLog() {
  const [actions, setActions] = useState<ActionLogEntry[]>([]);

  const addEntry = useCallback((entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) => {
    const full: ActionLogEntry = { ...entry, id: nextId(), timestamp: nowIso() };
    setActions((prev) => [...prev, full]);
    return full.id;
  }, []);

  const markAllRunningDone = useCallback(() => {
    setActions((prev) =>
      prev.map((e) => (e.status === 'running' ? { ...e, status: 'done' as const } : e)),
    );
  }, []);

  return { actions, addEntry, markAllRunningDone };
}

/**
 * Watches chat state and generates action log entries.
 * Since OpenClaw gateway handles tools server-side and only streams final text,
 * we infer actions from presence changes and response content.
 */
export function useActionLogSync(
  actionLog: ReturnType<typeof useActionLog>,
  presence: 'idle' | 'processing' | 'typing' | 'error',
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>,
) {
  const prevPresenceRef = useRef(presence);
  const processedRef = useRef<Set<string>>(new Set());

  // Detect presence changes → stream activity
  useEffect(() => {
    const prev = prevPresenceRef.current;
    prevPresenceRef.current = presence;

    if (prev === 'idle' && presence === 'processing') {
      actionLog.addEntry({ source: 'stream', label: 'Processing query', status: 'running', icon: '🧠' });
      actionLog.addEntry({ source: 'api', label: 'POST /v1/chat/completions', detail: 'Streaming...', status: 'running', icon: '🔌' });
    }

    if (prev === 'processing' && presence === 'typing') {
      actionLog.markAllRunningDone();
      actionLog.addEntry({ source: 'stream', label: 'Streaming response', status: 'running', icon: '💬' });
    }

    if ((prev === 'typing' || prev === 'processing') && presence === 'idle') {
      actionLog.markAllRunningDone();
    }

    if (presence === 'error') {
      actionLog.markAllRunningDone();
      actionLog.addEntry({ source: 'stream', label: 'Error occurred', status: 'error', icon: '❌' });
    }
  }, [presence, actionLog]);

  // Parse completed assistant messages for action patterns
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      if (processedRef.current.has(msg.id)) continue;
      if (!msg.content || msg.content.length < 5) continue;

      // Only process once the message is complete (presence is idle)
      if (presence !== 'idle') continue;

      processedRef.current.add(msg.id);

      const parsed = parseActionsFromText(msg.content);
      for (const action of parsed) {
        actionLog.addEntry({
          source: action.detail?.startsWith('INCIDENT') || action.detail?.startsWith('EVENT') || action.detail?.startsWith('PW') || action.detail?.startsWith('ORDER') ? 'record' : 'api',
          label: action.label,
          detail: action.detail,
          status: 'done',
          icon: action.icon,
        });
      }
    }
  }, [messages, presence, actionLog]);
}
