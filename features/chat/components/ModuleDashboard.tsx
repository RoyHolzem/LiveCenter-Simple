'use client';

import { useMemo, useState } from 'react';
import type { TelecomRecord, TelecomView } from '@/lib/types';
import { useTelecom } from '../hooks/useTelecom';
import { useAuthToken } from '@/features/auth/AuthWrapper';
import { cn } from '../chat-utils';
import {
  formatDateTime,
  formatRelative,
  severityTone,
  statusTone,
  summaryLabel,
  summaryValue,
} from '@/features/operations/ops-helpers';
import { VIEW_META } from '@/features/operations/view-meta';
import styles from '../styles/module-dashboard.module.css';

interface ModuleDashboardProps {
  view: TelecomView;
  onBackToXena: () => void;
}

const VIEW_ICON: Record<TelecomView, string> = {
  incidents: '⚡',
  events: '📡',
  'planned-works': '🔧',
  orders: '📦',
};

export function ModuleDashboard({ view, onBackToXena }: ModuleDashboardProps) {
  const getAuthToken = useAuthToken();
  const [search, setSearch] = useState('');

  const {
    records,
    filteredRecords,
    selectedRecord,
    setSelectedRecordIds,
    telecomLoading,
    telecomError,
    telecomLoadedAt,
    loadTelecomView,
  } = useTelecom(view, getAuthToken, search, {
    autoLoadOnMount: true,
    enablePolling: true,
  });

  const meta = VIEW_META.find((v) => v.key === view);

  const summaryCards = useMemo(() => {
    const regions = new Set(records.map((r) => r.networkRegion)).size;
    const critical = records.filter((r) => r.severity === 'SEV1').length;
    const operators = new Set(records.map((r) => r.operatorName)).size;
    return [
      { label: 'Total', value: records.length, hint: 'from DynamoDB' },
      { label: summaryLabel(view), value: summaryValue(view, records), hint: 'active' },
      { label: 'Critical', value: critical, hint: 'SEV1' },
      { label: 'Operators', value: operators, hint: `${regions} regions` },
    ];
  }, [view, records]);

  return (
    <div className={styles.moduleDashboard}>
      <div className={styles.moduleHeader}>
        <div className={styles.moduleHeaderLeft}>
          <button className={styles.backToXenaBtn} onClick={onBackToXena} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Xena
          </button>
          <div>
            <h1 className={styles.moduleTitle}>{meta?.label || view}</h1>
            <p className={styles.moduleSubtitle}>{meta?.subtitle}</p>
          </div>
        </div>

        <div className={styles.moduleToolbar}>
          <input
            className={styles.moduleSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, city, fiber, service..."
          />
          <button
            className={styles.moduleRefresh}
            onClick={() => void loadTelecomView(view, true)}
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.moduleSummaryRow}>
        {summaryCards.map((card) => (
          <div key={card.label} className={styles.moduleSummaryCard}>
            <div className={styles.moduleSummaryValue}>{card.value}</div>
            <div className={styles.moduleSummaryLabel}>{card.label}</div>
            <div className={styles.moduleSummaryHint}>{card.hint}</div>
          </div>
        ))}
      </div>

      <div className={styles.moduleGrid}>
        <div className={styles.moduleList}>
          {telecomLoading[view] && records.length === 0 ? (
            <div className={styles.moduleEmpty}>Loading from DynamoDB...</div>
          ) : telecomError[view] ? (
            <div className={styles.moduleEmpty}>Error: {telecomError[view]}</div>
          ) : filteredRecords.length === 0 ? (
            <div className={styles.moduleEmpty}>No records found.</div>
          ) : (
            filteredRecords.map((record, idx) => (
              <RecordCard
                key={record.recordId}
                record={record}
                view={view}
                isActive={selectedRecord?.recordId === record.recordId}
                index={idx}
                onClick={() => setSelectedRecordIds((prev) => ({ ...prev, [view]: record.recordId }))}
              />
            ))
          )}
        </div>

        <div className={styles.moduleDetail}>
          {selectedRecord ? (
            <RecordDetail record={selectedRecord} view={view} />
          ) : (
            <div className={styles.moduleEmpty}>Select a record to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Record Card (list item) ─── */

function RecordCard({
  record,
  view,
  isActive,
  index,
  onClick,
}: {
  record: TelecomRecord;
  view: TelecomView;
  isActive: boolean;
  index: number;
  onClick: () => void;
}) {
  const tone = severityTone(record.severity);
  return (
    <button
      type="button"
      className={cn(
        styles.moduleRecordCard,
        isActive && styles.moduleRecordCardActive,
        styles[`toneRow_${tone}`],
      )}
      style={{ animationDelay: `${Math.min(index * 25, 240)}ms` }}
      onClick={onClick}
    >
      {/* Top line: record ID + relative time */}
      <div className={styles.moduleRecordHead}>
        <span className={styles.moduleRecordId}>
          {VIEW_ICON[view]} {record.recordId}
        </span>
        <time>{formatRelative(record.updatedAt)}</time>
      </div>

      {/* Title */}
      <div className={styles.moduleRecordTitle}>{record.title}</div>

      {/* Badges */}
      <div className={styles.moduleRecordBadges}>
        <span className={cn(styles.sevBadge, styles[`tone_${tone}`])}>{record.severity}</span>
        <span className={cn(styles.statusBadgeChip, styles[`stat_${statusTone(record.status)}`])}>
          {record.status.replaceAll('_', ' ')}
        </span>
      </div>

      {/* Meta row */}
      <div className={styles.moduleRecordMeta}>
        {record.companyName && <span>{record.companyName}</span>}
        {record.serviceType && <span>{record.serviceType}</span>}
        {record.city && <span>{record.city}</span>}
      </div>
    </button>
  );
}

/* ─── Record Detail (right pane) ─── */

function RecordDetail({ record, view }: { record: TelecomRecord; view: TelecomView }) {
  const tone = severityTone(record.severity);
  const sTone = statusTone(record.status);

  return (
    <div key={record.recordId} className={styles.moduleDetailInner}>
      {/* Hero header with ID */}
      <div className={cn(styles.detailHero, styles[`tintBg_${tone}`])}>
        <div className={styles.detailHeroKind}>
          {VIEW_ICON[view]} {view.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </div>
        <div className={styles.detailHeroId}>{record.recordId}</div>
        <div className={styles.detailHeroTitle}>{record.title}</div>
        <div className={styles.detailHeroBadges}>
          <span className={cn(styles.sevBadge, styles[`tone_${tone}`])}>{record.severity}</span>
          <span className={cn(styles.statusBadgeChip, styles[`stat_${sTone}`])}>
            {record.status.replaceAll('_', ' ')}
          </span>
          <span className={styles.moduleDetailPriority}>{record.priority}</span>
        </div>
      </div>

      {/* Summary */}
      {record.summary && (
        <div className={styles.moduleDetailSummary}>{record.summary}</div>
      )}

      {/* Timestamps */}
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

      {/* Highlights */}
      {record.highlights.length > 0 && (
        <div className={styles.moduleDetailHighlights}>
          {record.highlights.map((h) => (
            <div key={h.label} className={styles.moduleDetailHighlight}>
              <div className={styles.moduleDetailHLLabel}>{h.label}</div>
              <div className={styles.moduleDetailHLValue}>{h.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Facts */}
      {record.facts.length > 0 && (
        <div className={styles.moduleDetailFacts}>
          {record.facts.map((f) => (
            <div key={f.label} className={styles.moduleDetailFactRow}>
              <span>{f.label}</span>
              <strong>{f.value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Customer notice */}
      {record.customerText && (
        <div className={styles.moduleDetailNotice}>
          <div className={styles.panelSectionTitle}>Customer notice</div>
          <p>{record.customerText}</p>
        </div>
      )}
    </div>
  );
}
