/**
 * Structured UI actions emitted by the Xena Operator (via SSE `xena_ui` lines).
 * Do not derive these from natural language; only from validated JSON.
 */

import type { TelecomView } from '@/lib/types';

export type XenaEntityKind = 'incident' | 'event' | 'planned-work';

export type XenaSearchResultRow = {
  recordId: string;
  title: string;
  status: string;
  severity: string;
};

export type XenaUiAction =
  | { type: 'OPEN_INCIDENT'; recordId: string }
  | { type: 'OPEN_EVENT'; recordId: string }
  | { type: 'OPEN_PLANNED_WORK'; recordId: string }
  | { type: 'SHOW_INCIDENT'; recordId: string }
  | { type: 'SHOW_EVENT'; recordId: string }
  | { type: 'SHOW_PLANNED_WORK'; recordId: string }
  | { type: 'SHOW_SEARCH_RESULTS'; entity: XenaEntityKind; results: XenaSearchResultRow[] }
  | { type: 'CLEAR_CONTEXT' }
  | { type: 'SET_AGENT_ACTIVITY'; phase: string; message: string }
  | { type: 'CLEAR_AGENT_ACTIVITY' };

export function entityKindToTelecomView(entity: string): TelecomView | null {
  if (entity === 'incident') return 'incidents';
  if (entity === 'event') return 'events';
  if (entity === 'planned-work') return 'planned-works';
  return null;
}

export function openActionToView(action: XenaUiAction): TelecomView | null {
  switch (action.type) {
    case 'OPEN_INCIDENT':
    case 'SHOW_INCIDENT':
      return 'incidents';
    case 'OPEN_EVENT':
    case 'SHOW_EVENT':
      return 'events';
    case 'OPEN_PLANNED_WORK':
    case 'SHOW_PLANNED_WORK':
      return 'planned-works';
    default:
      return null;
  }
}

export function openActionRecordId(action: XenaUiAction): string | null {
  switch (action.type) {
    case 'OPEN_INCIDENT':
    case 'OPEN_EVENT':
    case 'OPEN_PLANNED_WORK':
    case 'SHOW_INCIDENT':
    case 'SHOW_EVENT':
    case 'SHOW_PLANNED_WORK':
      return action.recordId;
    default:
      return null;
  }
}
