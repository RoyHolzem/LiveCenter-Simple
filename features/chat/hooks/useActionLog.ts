'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type ActionLogEntry = {
  id: string;
  timestamp: string;
  source: 'api' | 'stream' | 'record';
  label: string;
  detail?: string;
  /** JSON payload or expanded explanation */
  expanded?: string;
  status: 'running' | 'done' | 'error';
  icon: string;
};

let counter = 0;
function nextId(): string { return `a-${++counter}`; }
function nowIso(): string { return new Date().toISOString(); }

/** Parse assistant text for API action patterns — broadened matching */
function parseActionsFromText(text: string): Array<{ label: string; detail?: string; icon: string; expanded?: string }> {
  const actions: Array<{ label: string; detail?: string; icon: string; expanded?: string }> = [];
  const lower = text.toLowerCase();

  // Record ID patterns
  const recordRe = /\b(INCIDENT-LUX-\d+|EVENT-LUX-\d+|PW-LUX-\d+|ORDER-LUX-\d+)\b/g;
  let match: RegExpExecArray | null;
  const seenRecords = new Set<string>();
  while ((match = recordRe.exec(text)) !== null) {
    const id = match[1];
    if (seenRecords.has(id)) continue;
    seenRecords.add(id);
    let label = 'Matched record';
    let icon = '📋';
    if (id.startsWith('INCIDENT')) { label = 'Incident found'; icon = '⚠'; }
    else if (id.startsWith('EVENT')) { label = 'Event found'; icon = '⚡'; }
    else if (id.startsWith('PW')) { label = 'Maintenance found'; icon = '⚙'; }
    else if (id.startsWith('ORDER')) { label = 'Order found'; icon = '📦'; }
    actions.push({ label, detail: id, icon, expanded: `{\n  "recordId": "${id}",\n  "matched": true\n}` });
  }

  // POST patterns (create)
  if (/(?:created|added|opened|generated)\s+(?:a\s+)?(?:new\s+)?(?:incident|ticket)/i.test(lower)) {
    actions.push({ label: 'POST /incidents', detail: 'Created incident', icon: '✏️', expanded: '{\n  "method": "POST",\n  "path": "/incidents",\n  "status": 201\n}' });
  }
  if (/(?:created|added|opened)\s+(?:a\s+)?(?:new\s+)?event/i.test(lower)) {
    actions.push({ label: 'POST /events', detail: 'Created event', icon: '✏️', expanded: '{\n  "method": "POST",\n  "path": "/events",\n  "status": 201\n}' });
  }

  // PUT patterns (update)
  if (/(?:updated|changed|modified|set)\s+(?:the\s+)?(?:status\s+of\s+)?(?:the\s+)?(?:incident|event|maintenance|order)/i.test(lower)) {
    actions.push({ label: 'PUT update record', detail: 'Updated record', icon: '📝', expanded: '{\n  "method": "PUT",\n  "status": 200\n}' });
  }
  if (/(?:closed|resolved)\s+(?:the\s+)?(?:incident|event)/i.test(lower)) {
    actions.push({ label: 'PUT status → closed', detail: 'Closed record', icon: '✅', expanded: '{\n  "method": "PUT",\n  "body": { "status": "closed" }\n}' });
  }

  // GET patterns — broadened to catch "there are N", "N open", "found N", etc.
  const incidentMatch = lower.match(/(\d+)\s+(?:open\s+)?(?:active\s+)?incidents/i);
  if (incidentMatch || lower.includes('incidents')) {
    const count = incidentMatch ? incidentMatch[1] : '?';
    actions.push({ label: 'GET /incidents', detail: `${count} records`, icon: '🔍', expanded: `{\n  "method": "GET",\n  "path": "/incidents/latest",\n  "status": 200,\n  "count": ${count === '?' ? 'null' : count}\n}` });
  }
  const eventMatch = lower.match(/(\d+)\s+(?:open\s+)?(?:active\s+)?events/i);
  if (eventMatch || (lower.includes('events') && !lower.includes('incident'))) {
    const count = eventMatch ? eventMatch[1] : '?';
    actions.push({ label: 'GET /events', detail: `${count} records`, icon: '🔍', expanded: `{\n  "method": "GET",\n  "path": "/events/latest",\n  "status": 200,\n  "count": ${count === '?' ? 'null' : count}\n}` });
  }
  const maintMatch = lower.match(/(\d+)\s+(?:open\s+)?(?:active\s+)?(?:planned\s+works?|maintenance)/i);
  if (maintMatch || lower.includes('maintenance') || lower.includes('planned work')) {
    const count = maintMatch ? maintMatch[1] : '?';
    actions.push({ label: 'GET /planned-works', detail: `${count} records`, icon: '🔍', expanded: `{\n  "method": "GET",\n  "path": "/planned-works/latest",\n  "status": 200,\n  "count": ${count === '?' ? 'null' : count}\n}` });
  }

  // Web fetch / search patterns
  if (/(?:searched|searching|looked up|checked|fetched)\s+(?:the\s+)?(?:web|internet|online)/i.test(lower)) {
    actions.push({ label: 'web_search', detail: 'Searched the web', icon: '🌐', expanded: '{\n  "tool": "web_search",\n  "status": "completed"\n}' });
  }
  if (/(?:checked|verified|looked up)\s+(?:the\s+)?(?:weather|forecast|status|calendar)/i.test(lower)) {
    actions.push({ label: 'web_fetch', detail: 'Fetched external data', icon: '🌐', expanded: '{\n  "tool": "web_fetch",\n  "status": "completed"\n}' });
  }

  // Generic "N items" patterns for counts in text
  const genericCountMatch = lower.match(/(\d+)\s+(?:open|active|total|pending)\s+(?:items|records|entries)/i);
  if (genericCountMatch && actions.length === 0) {
    actions.push({ label: 'GET records', detail: `${genericCountMatch[1]} results`, icon: '🔍', expanded: `{\n  "status": 200,\n  "count": ${genericCountMatch[1]}\n}` });
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

export function useActionLogSync(
  actionLog: ReturnType<typeof useActionLog>,
  presence: 'idle' | 'processing' | 'typing' | 'error',
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>,
) {
  const prevPresenceRef = useRef(presence);
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const prev = prevPresenceRef.current;
    prevPresenceRef.current = presence;

    if (prev === 'idle' && presence === 'processing') {
      actionLog.addEntry({
        source: 'stream',
        label: 'Processing',
        detail: 'Operator is thinking...',
        status: 'running',
        icon: '▸',
        expanded: '{\n  "event": "processing_start",\n  "agent": "openclaw/operator",\n  "action": "The operator received your message and is deciding which tools to use. It may query APIs, search records, or fetch external data."\n}',
      });
      actionLog.addEntry({
        source: 'api',
        label: 'POST /v1/chat/completions',
        detail: 'Streaming...',
        status: 'running',
        icon: '🔌',
        expanded: '{\n  "method": "POST",\n  "url": "/v1/chat/completions",\n  "stream": true,\n  "model": "openclaw/operator"\n}',
      });
    }

    if (prev === 'processing' && presence === 'typing') {
      actionLog.markAllRunningDone();
      actionLog.addEntry({
        source: 'stream',
        label: 'Streaming response',
        detail: 'Receiving tokens...',
        status: 'running',
        icon: '💬',
      });
    }

    if ((prev === 'typing' || prev === 'processing') && presence === 'idle') {
      actionLog.markAllRunningDone();
    }

    if (presence === 'error') {
      actionLog.markAllRunningDone();
      actionLog.addEntry({ source: 'stream', label: 'Error', status: 'error', icon: '❌' });
    }
  }, [presence, actionLog]);

  // Parse completed assistant messages for action patterns
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      if (processedRef.current.has(msg.id)) continue;
      if (!msg.content || msg.content.length < 5) continue;
      if (presence !== 'idle') continue;

      processedRef.current.add(msg.id);

      const parsed = parseActionsFromText(msg.content);
      for (const action of parsed) {
        actionLog.addEntry({
          source: action.detail?.match(/^[A-Z]+-LUX-/) ? 'record' : 'api',
          label: action.label,
          detail: action.detail,
          expanded: action.expanded,
          status: 'done',
          icon: action.icon,
        });
      }
    }
  }, [messages, presence, actionLog]);
}
