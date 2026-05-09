'use client';

import type { TelecomRecord, TelecomView } from '@/lib/types';
import type { SearchResultsState } from '../hooks/useCockpitState';
import { entityKindToTelecomView } from '@/lib/xena-ui-actions';
import { cn } from '../chat-utils';
import {
  severityTone,
  statusTone,
} from '@/features/operations/ops-helpers';
import styles from '../chat-shell.module.css';

interface LeftPanelProps {
  visible: boolean;
  contextView: TelecomView;
  onContextViewChange: (view: TelecomView) => void;
  searchResults: SearchResultsState;
  selectedRecordId: string | null;
  onPickSearchResult: (view: TelecomView, recordId: string) => void;
  records: TelecomRecord[];
  onPickRecord: (view: TelecomView, recordId: string) => void;
}

const CONTEXT_TABS: Array<{ key: TelecomView; label: string }> = [
  { key: 'incidents', label: 'Incidents' },
  { key: 'events', label: 'Events' },
  { key: 'planned-works', label: 'Maint.' },
];

interface RecordRowData {
  recordId: string;
  title: string;
  status: string;
  severity: string;
}

function RecordRow({
  row,
  active,
  index,
  onClick,
}: {
  row: RecordRowData;
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  const sevTone = severityTone(row.severity);
  return (
    <li>
      <button
        type="button"
        className={cn(
          styles.searchResultRow,
          styles[`toneRow_${sevTone}`],
          active && styles.searchResultRowActive,
        )}
        style={{ animationDelay: `${Math.min(index * 25, 220)}ms` }}
        onClick={onClick}
      >
        <div className={styles.searchResultHead}>
          <span className={cn(styles.sevBadge, styles[`tone_${sevTone}`])}>
            {row.severity}
          </span>
          <span className={cn(styles.statusBadgeChip, styles[`stat_${statusTone(row.status)}`])}>
            {row.status.replaceAll('_', ' ')}
          </span>
        </div>
        <div className={styles.searchResultTitle}>{row.title}</div>
        <div className={styles.searchResultId}>{row.recordId}</div>
      </button>
    </li>
  );
}

export function LeftPanel({
  visible,
  contextView,
  onContextViewChange,
  searchResults,
  selectedRecordId,
  onPickSearchResult,
  records,
  onPickRecord,
}: LeftPanelProps) {
  const viewForResults = searchResults ? entityKindToTelecomView(searchResults.entity) : null;

  return (
    <aside className={cn(styles.sidePanel, styles.leftPanel, visible && styles.panelVisible)}>
      <div className={styles.panelSection}>
        <div className={styles.panelSectionTitle}>Context</div>
        <div className={styles.contextTabs} role="tablist" aria-label="Operational domain">
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

        {searchResults && viewForResults ? (
          <div className={styles.searchResultsBlock}>
            <div className={styles.searchResultsTitle}>
              {searchResults.entity === 'incident' && `${searchResults.results.length} matching incidents`}
              {searchResults.entity === 'event' && `${searchResults.results.length} matching events`}
              {searchResults.entity === 'planned-work' && `${searchResults.results.length} matching planned works`}
              {searchResults.entity === 'order' && `${searchResults.results.length} matching orders`}
            </div>
            <ul className={styles.searchResultsList}>
              {searchResults.results.map((row, i) => (
                <RecordRow
                  key={row.recordId}
                  row={row}
                  index={i}
                  active={selectedRecordId === row.recordId}
                  onClick={() => onPickSearchResult(viewForResults, row.recordId)}
                />
              ))}
            </ul>
          </div>
        ) : selectedRecordId ? (
          <div key={selectedRecordId} className={cn(styles.contextCard, styles.contextCardFocused)}>
            <div className={styles.contextLabel}>{selectedRecordId}</div>
            <div className={styles.contextHint}>Selected operational record</div>
          </div>
        ) : records && records.length > 0 ? (
          <ul key={contextView} className={styles.searchResultsList}>
            {records.slice(0, 15).map((row, i) => (
              <RecordRow
                key={row.recordId}
                row={row}
                index={i}
                active={selectedRecordId === row.recordId}
                onClick={() => onPickRecord(contextView, row.recordId)}
              />
            ))}
          </ul>
        ) : (
          <div className={styles.panelEmpty}>
            <div className={styles.panelEmptyIcon}>&#x2726;</div>
            <div>
              No operational context loaded yet. Ask the operator to open an incident, event, or planned work — or use
              the tabs to choose a domain for your next command.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
