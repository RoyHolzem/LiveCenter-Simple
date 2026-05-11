'use client';

import { useState } from 'react';
import type { ActionLogEntry } from '../hooks/useActionLog';
import { cn } from '../chat-utils';
import styles from '../styles/actions.module.css';

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

function ActionEntry({ entry }: { entry: ActionLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isClickable = !!entry.expanded;

  return (
    <div>
      <div
        className={cn(
          styles.agentActionEntry,
          entry.status === 'running' && styles.agentAction_running,
          entry.status === 'done' && styles.agentAction_done,
          entry.status === 'error' && styles.agentAction_error,
          isClickable && styles.agentActionClickable,
        )}
        onClick={isClickable ? () => setExpanded(!expanded) : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
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
        <div className={styles.agentActionMeta}>
          {isClickable && (
            <span className={styles.agentActionChevron}>
              {expanded ? '▴' : '▾'}
            </span>
          )}
          <span className={styles.agentActionTime}>
            {formatTime(entry.timestamp)}
          </span>
        </div>
      </div>
      {expanded && entry.expanded && (
        <div className={styles.agentActionExpanded}>
          <pre className={styles.agentActionJson}>{entry.expanded}</pre>
        </div>
      )}
    </div>
  );
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
            <ActionEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </aside>
  );
}
