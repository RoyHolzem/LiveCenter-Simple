'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { XenaActionEvent } from '@/lib/types';
import type { XenaUiAction } from '@/lib/xena-ui-actions';

export type ActionLogEntry = {
  id: string;
  timestamp: string;
  source: 'tool' | 'ui_action' | 'stream' | 'record';
  label: string;
  detail?: string;
  status: 'running' | 'done' | 'error';
  icon: string;
};

let counter = 0;
function nextId(): string {
  return `a-${++counter}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

function actionIcon(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('incident')) return '⚠';
  if (l.includes('event')) return '⚡';
  if (l.includes('planned') || l.includes('maint')) return '⚙';
  if (l.includes('order')) return '📦';
  if (l.includes('search') || l.includes('query')) return '🔍';
  if (l.includes('stream') || l.includes('response')) return '💬';
  if (l.includes('record') || l.includes('found')) return '📋';
  if (l.includes('lambda')) return 'λ';
  if (l.includes('dynamodb')) return '🗄';
  if (l.includes('api')) return '🔌';
  if (l.includes('thinking') || l.includes('processing')) return '🧠';
  return '▸';
}

/**
 * Hook that manages the agent action log.
 * Generates entries based on streaming state changes and SSE events.
 */
export function useActionLog() {
  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const pendingRef = useRef<Map<string, string>>(new Map()); // label → id

  const addEntry = useCallback((entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) => {
    const full: ActionLogEntry = {
      ...entry,
      id: nextId(),
      timestamp: nowIso(),
    };
    setActions((prev) => [...prev, full]);
    if (entry.status === 'running') {
      pendingRef.current.set(entry.label, full.id);
    }
    return full.id;
  }, []);

  const markDone = useCallback((id: string) => {
    setActions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'done' as const } : e)),
    );
  }, []);

  const markAllRunningDone = useCallback(() => {
    setActions((prev) =>
      prev.map((e) => (e.status === 'running' ? { ...e, status: 'done' as const } : e)),
    );
    pendingRef.current.clear();
  }, []);

  return { actions, addEntry, markDone, markAllRunningDone };
}

/**
 * Hook that watches chat state and generates action log entries.
 * Call from ChatShell or similar top-level component.
 */
export function useActionLogSync(
  actionLog: ReturnType<typeof useActionLog>,
  presence: 'idle' | 'processing' | 'typing' | 'error',
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>,
) {
  const prevPresenceRef = useRef(presence);
  const prevMsgCountRef = useRef(messages.length);
  const processedContentRef = useRef<Set<string>>(new Set());

  // Detect presence changes → generate stream actions
  useEffect(() => {
    const prev = prevPresenceRef.current;
    prevPresenceRef.current = presence;

    if (prev === 'idle' && presence === 'processing') {
      // User sent a message, agent starts processing
      actionLog.addEntry({
        source: 'stream',
        label: 'Processing query',
        status: 'running',
        icon: '🧠',
      });
    }

    if (prev === 'processing' && presence === 'typing') {
      // Agent started streaming response
      actionLog.markAllRunningDone();
      actionLog.addEntry({
        source: 'stream',
        label: 'Generating response',
        status: 'running',
        icon: '💬',
      });
    }

    if ((prev === 'typing' || prev === 'processing') && presence === 'idle') {
      // Agent finished
      actionLog.markAllRunningDone();
    }

    if (presence === 'error') {
      actionLog.markAllRunningDone();
      actionLog.addEntry({
        source: 'stream',
        label: 'Error occurred',
        status: 'error',
        icon: '❌',
      });
    }
  }, [presence, actionLog]);

  // Detect new assistant messages → scan for record IDs and action patterns
  useEffect(() => {
    if (messages.length <= prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      return;
    }
    prevMsgCountRef.current = messages.length;

    // Only process assistant messages
    const newMsgs = messages.slice(-(messages.length - prevMsgCountRef.current));
    for (const msg of newMsgs) {
      if (msg.role !== 'assistant') continue;
      if (processedContentRef.current.has(msg.id)) continue;
      if (!msg.content || msg.content.length < 20) continue;

      processedContentRef.current.add(msg.id);

      // Scan for record IDs
      const recordIdRe = /\b(INCIDENT-LUX-\d+|EVENT-LUX-\d+|PW-LUX-\d+|ORDER-LUX-\d+)\b/g;
      let match: RegExpExecArray | null;
      while ((match = recordIdRe.exec(msg.content)) !== null) {
        const recordId = match[1];
        let label = 'Found record';
        if (recordId.startsWith('INCIDENT')) label = 'Matched incident';
        else if (recordId.startsWith('EVENT')) label = 'Matched event';
        else if (recordId.startsWith('PW')) label = 'Matched maintenance';
        else if (recordId.startsWith('ORDER')) label = 'Matched order';

        actionLog.addEntry({
          source: 'record',
          label,
          detail: recordId,
          status: 'done',
          icon: actionIcon(label),
        });
      }
    }
  }, [messages, actionLog]);
}

/** Create a log entry from a tool/action SSE event */
export function toolEventToEntry(event: XenaActionEvent): Omit<ActionLogEntry, 'id' | 'timestamp'> {
  const label = `${event.verb} ${event.label}`;
  const detail = event.resource || event.region || event.detail;
  return {
    source: 'tool',
    label,
    detail,
    status: 'done',
    icon: actionIcon(`${event.category} ${event.label}`),
  };
}

/** Tool names to friendly labels + icons */
const TOOL_DISPLAY: Record<string, { label: string; icon: string }> = {
  exec: { label: 'Execute command', icon: '⚡' },
  read: { label: 'Read file', icon: '📖' },
  write: { label: 'Write file', icon: '✏️' },
  edit: { label: 'Edit file', icon: '✏️' },
  web_fetch: { label: 'Fetch URL', icon: '🌐' },
  web_post: { label: 'POST request', icon: '📤' },
  web_put: { label: 'PUT request', icon: '📤' },
  web_search: { label: 'Web search', icon: '🔍' },
  browser: { label: 'Browser action', icon: '🖥' },
  process: { label: 'Manage process', icon: '⚙' },
  message: { label: 'Send message', icon: '💬' },
  tts: { label: 'Text to speech', icon: '🔊' },
  canvas: { label: 'Canvas render', icon: '🎨' },
  nodes: { label: 'Node control', icon: '📱' },
  evolution_proposal: { label: 'Propose evolution', icon: '🧬' },
};

/** Create a log entry from a tool call */
export function toolCallToEntry(name: string, args: string): Omit<ActionLogEntry, 'id' | 'timestamp'> {
  const display = TOOL_DISPLAY[name] || { label: name, icon: '🔧' };
  let detail: string | undefined;
  try {
    const parsed = JSON.parse(args);
    // Extract the most useful detail field
    detail = parsed.command || parsed.url || parsed.path || parsed.query || parsed.file_path
      || (typeof parsed.body === 'string' ? parsed.body.substring(0, 80) : undefined)
      || (name === 'exec' && parsed.command ? parsed.command : undefined);
  } catch {
    if (args && args.length > 0 && args.length < 100) detail = args;
  }
  return {
    source: 'tool',
    label: display.label,
    detail,
    status: 'running',
    icon: display.icon,
  };
}

/** Create a log entry from a tool result */
export function toolResultToEntry(name: string, content: string): Omit<ActionLogEntry, 'id' | 'timestamp'> {
  const display = TOOL_DISPLAY[name] || { label: name, icon: '🔧' };
  const truncated = content.length > 120 ? content.substring(0, 120) + '...' : content;
  return {
    source: 'tool',
    label: `${display.label} → done`,
    detail: truncated,
    status: 'done',
    icon: '✓',
  };
}

/** Create a log entry from a UI action */
export function uiActionToEntry(action: XenaUiAction): Omit<ActionLogEntry, 'id' | 'timestamp'> {
  let label = action.type.replace(/_/g, ' ').toLowerCase();
  let detail: string | undefined;
  let iconStr = '▸';

  if ('recordId' in action && action.recordId) {
    detail = action.recordId;
    if (action.type.includes('INCIDENT')) iconStr = '⚠';
    else if (action.type.includes('EVENT')) iconStr = '⚡';
    else if (action.type.includes('PLANNED')) iconStr = '⚙';
    else if (action.type.includes('ORDER')) iconStr = '📦';
  } else if (action.type === 'SHOW_SEARCH_RESULTS') {
    detail = `${action.entity} (${action.results.length} results)`;
    iconStr = '🔍';
  } else if (action.type === 'SET_AGENT_ACTIVITY') {
    detail = action.message;
    iconStr = '▸';
  }

  return { source: 'ui_action', label, detail, status: 'done', icon: iconStr };
}
