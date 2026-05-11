'use client';

import { useState, useMemo } from 'react';
import type { TelecomRecord, TelecomView } from '@/lib/types';
import { cn } from '../chat-utils';
import {
  formatDateTime,
  severityTone,
  statusTone,
} from '@/features/operations/ops-helpers';
import styles from '../styles/side-panel.module.css';

interface RightPanelProps {
  visible: boolean;
  selectedRecord: TelecomRecord | null;
  activeView: TelecomView;
}

const VIEW_LABEL: Record<TelecomView, string> = {
  incidents: 'Incident',
  events: 'Event',
  'planned-works': 'Maintenance',
  orders: 'Order',
};

export function RightPanel({ visible, selectedRecord, activeView }: RightPanelProps) {
  return (
    <aside className={cn(styles.sidePanel, styles.rightPanel, visible && styles.panelVisible)}>
      {!selectedRecord ? (
        <div className={styles.panelEmpty}>
          <div className={styles.panelEmptyIcon}>&#x25B8;</div>
          <div>No operational record selected. Ask the operator to open one, or pick from the left panel.</div>
        </div>
      ) : (
        <RecordDossier
          key={selectedRecord.recordId}
          record={selectedRecord}
          activeView={activeView}
        />
      )}
    </aside>
  );
}

function RecordDossier({ record, activeView }: { record: TelecomRecord; activeView: TelecomView }) {
  const sevTone = severityTone(record.severity);
  const tintClass = `tintBg_${sevTone}`;
  const railClass = `toneRow_${sevTone}`;

  return (
    <div className={cn(styles.detailWrap, styles.recordSwap)}>
      {/* Hero — severity-rail header */}
      <div className={cn(styles.detailHero, styles[railClass], styles[tintClass])}>
        <div className={styles.detailHeader}>
          <div className={styles.detailKindLabel}>{VIEW_LABEL[activeView]}</div>

          <div className={styles.detailTitle}>{record.title}</div>

          <div className={styles.detailRecordId}>{record.recordId}</div>

          <div className={styles.detailBadges}>
            <span className={cn(styles.sevBadge, styles[`tone_${severityTone(record.severity)}`])}>
              {record.severity}
            </span>
            <span className={cn(styles.statusBadgeChip, styles[`stat_${statusTone(record.status)}`])}>
              {record.status.replaceAll('_', ' ')}
            </span>
          </div>
        </div>

        {record.summary && <div className={styles.detailSummary}>{record.summary}</div>}

        <div className={styles.detailTimes}>
          <div className={styles.detailTimeRow}>
            <span>Start</span>
            <strong>{formatDateTime(record.startTime)}</strong>
          </div>
          {record.endTime && (
            <div className={styles.detailTimeRow}>
              <span>End</span>
              <strong>{formatDateTime(record.endTime)}</strong>
            </div>
          )}
          <div className={styles.detailTimeRow}>
            <span>Updated</span>
            <strong>{formatDateTime(record.updatedAt)}</strong>
          </div>
        </div>
      </div>

      {/* Expandable sections — progressive disclosure */}
      <ExpandSection
        title="Key facts"
        count={record.highlights.length}
        defaultOpen
      >
        <div className={styles.factGrid}>
          {record.highlights.map((h) => (
            <div key={h.label} className={styles.factTile}>
              <div className={styles.factTileLabel}>{h.label}</div>
              <div className={styles.factTileValue}>{h.value}</div>
            </div>
          ))}
        </div>
      </ExpandSection>

      {record.facts.length > 0 && (
        <ExpandSection
          title="Network & contacts"
          count={record.facts.length}
          defaultOpen={false}
        >
          <div className={styles.detailFactList}>
            {record.facts.map((f) => (
              <div key={f.label} className={styles.detailFactRow}>
                <span>{f.label}</span>
                <strong>{f.value}</strong>
              </div>
            ))}
          </div>
        </ExpandSection>
      )}

      {record.customerText && (
        <ExpandSection title="Customer notice" defaultOpen={false}>
          <div className={styles.noticeText}>{record.customerText}</div>
        </ExpandSection>
      )}
    </div>
  );
}

interface ExpandSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function ExpandSection({ title, count, defaultOpen = false, children }: ExpandSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useMemo(() => `expand-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <section className={styles.expandSection}>
      <button
        type="button"
        className={styles.expandHeader}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.expandHeaderTitle}>
          {title}
          {typeof count === 'number' && count > 0 && (
            <span className={styles.expandHeaderCount}>{count}</span>
          )}
        </span>
        <svg
          className={cn(styles.expandChevron, open && styles.expandChevronOpen)}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {open && (
        <div id={id} className={styles.expandBody}>
          {children}
        </div>
      )}
    </section>
  );
}
