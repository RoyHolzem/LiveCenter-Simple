'use client';

import type { AgentActivityState } from '../hooks/useCockpitState';
import styles from '../styles/agentactivity.module.css';

interface AgentActivityBarProps {
  activity: AgentActivityState;
}

export function AgentActivityBar({ activity }: AgentActivityBarProps) {
  if (!activity) return null;
  return (
    <div className={styles.agentActivityBar} role="status" aria-live="polite">
      <span className={styles.agentActivityDot} />
      <span className={styles.agentActivityText}>{activity.message}</span>
    </div>
  );
}
