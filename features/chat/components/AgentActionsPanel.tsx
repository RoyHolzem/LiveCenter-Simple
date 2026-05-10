'use client';

import type { XenaActionEvent } from '@/lib/types';
import type { XenaUiAction } from '@/lib/xena-ui-actions';
import { cn } from '../chat-utils';
import styles from '../chat-shell.module.css';

export type ActionLogEntry = {
  id: string;
  timestamp: string;
  /** Where this action came from */
  source: 'tool' | 'ui_action' | 'api';
  /** Display label */
  label: string;
  /** Short detail (recordId, resource name, etc.) */
  detail?: string;
  /** Status */
  status: 'running' | 'done' | 'error';
  /** Category icon hint */
  icon: string;
};

let counter = 0;
function nextId(): string {
  return `a-${++counter}-${Date.now().toString(36)}`;
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

function actionIcon(source: string, label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('incident')) return '⚠';
  if (lower.includes('event')) return '⚡';
  if (lower.includes('planned') || lower.includes('maint')) return '⚙';
  if (lower.includes('order')) return '📦';
  if (lower.includes('search')) return '🔍';
  if (lower.includes('lambda')) return 'λ';
  if (lower.includes('dynamodb')) return '🗄';
  if (lower.includes('api')) return '🔌';
  if (lower.includes('s3')) return '🪣';
  if (lower.includes('cloudformation')) return '🏗';
  if (lower.includes('iam')) return '🔑';
  if (lower.includes('sns')) return '📧';
  if (lower.includes('cloudwatch')) return '📊';
  if (lower.includes('exec')) return '⚡';
  if (lower.includes('fetch') || lower.includes('web_')) return '🌐';
  if (lower.includes('read')) return '📖';
  if (lower.includes('write')) return '✏️';
  if (source === 'tool') return '🔧';
  if (source === 'api') return '📡';
  return '▸';
}

/** Create a log entry from a tool/action SSE event */
export function toolEventToEntry(event: XenaActionEvent): ActionLogEntry {
  const label = `${event.verb} ${event.label}`;
  const detail = event.resource || event.region || event.detail;
  return {
    id: nextId(),
    timestamp: event.timestamp || new Date().toISOString(),
    source: 'tool',
    label,
    detail,
    status: 'done',
    icon: actionIcon('tool', `${event.category} ${event.label}`),
  };
}

/** Create a log entry from a UI action */
export function uiActionToEntry(action: XenaUiAction): ActionLogEntry {
  let label = action.type.replace(/_/g, ' ').toLowerCase();
  let detail: string | undefined;
  let iconStr = '▸';

  switch (action.type) {
    case 'OPEN_INCIDENT':
    case 'SHOW_INCIDENT':
      detail = action.recordId;
      iconStr = '⚠';
      break;
    case 'OPEN_EVENT':
    case 'SHOW_EVENT':
      detail = action.recordId;
      iconStr = '⚡';
      break;
    case 'OPEN_PLANNED_WORK':
    case 'SHOW_PLANNED_WORK':
      detail = action.recordId;
      iconStr = '⚙';
      break;
    case 'OPEN_ORDER':
    case 'SHOW_ORDER':
      detail = action.recordId;
      iconStr = '📦';
      break;
    case 'SHOW_SEARCH_RESULTS':
      detail = `${action.entity} (${action.results.length} results)`;
      iconStr = '🔍';
      break;
    case 'SET_AGENT_ACTIVITY':
      detail = action.message;
      iconStr = '▸';
      break;
    case 'CLEAR_CONTEXT':
      iconStr = '✕';
      break;
    case 'CLEAR_AGENT_ACTIVITY':
      iconStr = '✕';
      break;
  }

  return {
    id: nextId(),
    timestamp: new Date().toISOString(),
    source: 'ui_action',
    label,
    detail,
    status: 'done',
    icon: iconStr,
  };
}

interface AgentActionsPanelProps {
  actions: ActionLogEntry[];
}

export function AgentActionsPanel({ actions }: AgentActionsPanelProps) {
  return (
    <aside className={styles.agentActionsPanel}>
      <div className={styles.agentActionsHeader}>
        <div className={styles.agentActionsDot} />
        <span className={styles.agentActionsTitle}>Agent Actions</span>
        {actions.length > 0 && (
          <span className={styles.agentActionsCount}>{actions.length}</span>
        )}
      </div>
      <div className={styles.agentActionsList}>
        {actions.length === 0 ? (
          <div className={styles.agentActionsEmpty}>
            <div className={styles.agentActionsEmptyIcon}>⏳</div>
            <div>No actions yet. Ask the operator something to see its tool calls here.</div>
          </div>
        ) : (
          actions.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.agentActionEntry} ${styles[`agentAction_${entry.status}`]}`}
            >
              <div className={styles.agentActionIcon}>{entry.icon}</div>
              <div className={styles.agentActionContent}>
                <div className={styles.agentActionLabel}>{entry.label}</div>
                {entry.detail && (
                  <div className={styles.agentActionDetail}>{entry.detail}</div>
                )}
              </div>
              <div className={styles.agentActionTime}>
                {formatTime(entry.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
