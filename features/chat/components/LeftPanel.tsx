'use client';

import type { TelecomView } from '@/lib/types';
import { cn } from '../chat-utils';
import styles from '../chat-shell.module.css';

interface LeftPanelProps {
  visible: boolean;
  selectedContext: string | null;
  contextView: TelecomView;
  onContextViewChange: (view: TelecomView) => void;
}

const CONTEXT_TABS: Array<{ key: TelecomView; label: string }> = [
  { key: 'incidents', label: 'Incidents' },
  { key: 'events', label: 'Events' },
  { key: 'planned-works', label: 'Maint.' },
];

export function LeftPanel({
  visible,
  selectedContext,
  contextView,
  onContextViewChange,
}: LeftPanelProps) {
  return (
    <aside className={cn(styles.sidePanel, styles.leftPanel, visible && styles.panelVisible)}>
      <div className={styles.panelSection}>
        <div className={styles.panelSectionTitle}>Context</div>
        <div className={styles.contextTabs} role="tablist" aria-label="Data source">
          {CONTEXT_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={contextView === key}
              className={cn(styles.contextTab, contextView === key && styles.contextTabActive)}
              onClick={() => onContextViewChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {selectedContext ? (
          <div key={selectedContext} className={cn(styles.contextCard, styles.contextCardFocused)}>
            <div className={styles.contextLabel}>{selectedContext}</div>
            <div className={styles.contextHint}>Xena is focused on this record</div>
          </div>
        ) : (
          <div className={styles.panelEmpty}>
            <div className={styles.panelEmptyIcon}>&#x2726;</div>
            <div>Say &quot;show me incident SEV-001&quot; or ask Xena about any record</div>
          </div>
        )}
      </div>
    </aside>
  );
}
