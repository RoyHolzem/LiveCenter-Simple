import type { TelecomView, XenaActionEvent, XenaTelecomFocusEvent } from '@/lib/types';
import type { XenaUiAction } from '@/lib/xena-ui-actions';
import { normalizeUiActions } from './ui-action-dispatcher';

export type ParsedSseLine =
  | { kind: 'xena_ui'; actions: XenaUiAction[] }
  | { kind: 'action'; event: XenaActionEvent }
  | { kind: 'delta'; text: string }
  | { kind: 'skip' };

function isTelecomView(value: unknown): value is TelecomView {
  return value === 'incidents' || value === 'events' || value === 'planned-works';
}

function telecomFocusToOpenAction(view: TelecomView, recordId: string): XenaUiAction {
  if (view === 'incidents') return { type: 'OPEN_INCIDENT', recordId };
  if (view === 'events') return { type: 'OPEN_EVENT', recordId };
  return { type: 'OPEN_PLANNED_WORK', recordId };
}

/** Parse one gateway SSE JSON object (after `data: `). */
export function parseSseDataObject(parsed: unknown): ParsedSseLine {
  if (!parsed || typeof parsed !== 'object') return { kind: 'skip' };
  const o = parsed as Record<string, unknown>;

  if (o.type === 'xena_ui' && Array.isArray(o.uiActions)) {
    const actions = normalizeUiActions(o.uiActions);
    if (actions.length === 0) return { kind: 'skip' };
    return { kind: 'xena_ui', actions };
  }

  if (o.type === 'telecom_focus' && typeof o.recordId === 'string' && o.recordId.trim() && isTelecomView(o.view)) {
    const actions: XenaUiAction[] = [telecomFocusToOpenAction(o.view, o.recordId.trim())];
    return { kind: 'xena_ui', actions };
  }

  if (o.type === 'action' && typeof o.verb === 'string' && typeof o.category === 'string' && typeof o.label === 'string') {
    return { kind: 'action', event: parsed as XenaActionEvent };
  }

  const delta =
    (parsed as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> }).choices?.[0]
      ?.delta?.content ??
    (parsed as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
  if (typeof delta === 'string' && delta.length > 0) {
    return { kind: 'delta', text: delta };
  }

  return { kind: 'skip' };
}
