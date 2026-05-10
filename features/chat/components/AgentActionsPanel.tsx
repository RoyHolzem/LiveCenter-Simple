'use client';

import type { ActionLogEntry } from '../hooks/useActionLog';
import { cn } from '../chat-utils';
import styles from '../chat-shell.module.css';

interface AgentActionsPanelProps {
  actions: ActionLogEntry[];
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
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
            <div>No actions yet. Ask the operator something to see its activity here.</div>
          </div>
        ) : (
          actions.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                styles.agentActionEntry,
                entry.status === 'running' && styles.agentAction_running,
                entry.status === 'done' && styles.agentAction_done,
                entry.status === 'error' && styles.agentAction_error,
              )}
            >
              <div className={styles.agentActionIcon}>
                {entry.status === 'running' ? (
                  <span className={styles.agentActionSpinner}>◌</span>
                ) : (
                  entry.icon
                )}
              </div>
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
