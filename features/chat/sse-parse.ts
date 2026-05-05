import type { TelecomView, XenaActionEvent, XenaTelecomFocusEvent } from '@/lib/types';

export type ParsedSseLine =
  | { kind: 'telecom_focus'; event: XenaTelecomFocusEvent }
  | { kind: 'action'; event: XenaActionEvent }
  | { kind: 'delta'; text: string }
  | { kind: 'skip' };

function isTelecomView(value: unknown): value is TelecomView {
  return value === 'incidents' || value === 'events' || value === 'planned-works';
}

/** Parse one gateway SSE JSON object (after `data: `). */
export function parseSseDataObject(parsed: unknown): ParsedSseLine {
  if (!parsed || typeof parsed !== 'object') return { kind: 'skip' };
  const o = parsed as Record<string, unknown>;

  if (o.type === 'telecom_focus' && typeof o.recordId === 'string' && o.recordId.trim() && isTelecomView(o.view)) {
    const event: XenaTelecomFocusEvent = {
      type: 'telecom_focus',
      view: o.view,
      recordId: o.recordId.trim(),
      label: typeof o.label === 'string' ? o.label : undefined,
    };
    return { kind: 'telecom_focus', event };
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
