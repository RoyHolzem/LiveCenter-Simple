'use client';

import type { TelecomRecord, TelecomView } from '@/lib/types';
import { cn } from '../chat-utils';
import {
  formatDateTime,
  severityTone,
  statusTone,
} from '@/features/operations/ops-helpers';
import styles from '../chat-shell.module.css';

interface ContextCardProps {
  record: TelecomRecord;
  view: TelecomView;
  compact?: boolean;
}

export function ContextCard({ record, view, compact }: ContextCardProps) {
  const entityLabel =
    view === 'incidents' ? 'Incident'
    : view === 'events' ? 'Event'
    : 'Maintenance';

  const typeLabel = record.typeCode || entityLabel;

  return (
    <div className={cn(styles.contextCard, compact && styles.contextCardCompact)}>
      <div className={styles.contextCardHeader}>
        <div className={styles.contextCardType}>{typeLabel}</div>
        <div className={styles.contextCardBadges}>
          <span className={cn(styles.sevBadge, styles[`tone_${severityTone(record.severity)}`])}>
            {record.severity}
          </span>
          <span className={cn(styles.statusBadgeChip, styles[`stat_${statusTone(record.status)}`])}>
            {record.status.replaceAll('_', ' ')}
          </span>
        </div>
      </div>

      <div className={styles.contextCardTitle}>{record.title}</div>

      {!compact && record.summary && (
        <div className={styles.contextCardSummary}>{record.summary}</div>
      )}

      <div className={styles.contextCardMeta}>
        <div className={styles.contextCardMetaRow}>
          <span>Start</span>
          <strong>{formatDateTime(record.startTime)}</strong>
        </div>
        {record.endTime && (
          <div className={styles.contextCardMetaRow}>
            <span>End</span>
            <strong>{formatDateTime(record.endTime)}</strong>
          </div>
        )}
        {record.companyName && record.companyName !== '—' && (
          <div className={styles.contextCardMetaRow}>
            <span>Customer</span>
            <strong>{record.companyName}</strong>
          </div>
        )}
        {record.city && record.city !== '—' && (
          <div className={styles.contextCardMetaRow}>
            <span>Location</span>
            <strong>{record.city}</strong>
          </div>
        )}
      </div>

      {!compact && record.highlights.length > 0 && (
        <div className={styles.contextCardFacts}>
          {record.highlights.slice(0, 3).map((h) => (
            <div key={h.label} className={styles.contextCardFact}>
              <span>{h.label}</span>
              <strong>{h.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
