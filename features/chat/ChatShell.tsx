'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { publicConfig } from './chat-config';
import { useAuthToken, useCurrentUser, useSignOut } from '../auth/AuthWrapper';
import styles from './chat-shell.module.css';
import type {
  ActionLogEntry,
  ActionSource,
  AvatarState,
  ChatMessage,
  PresenceState,
  XenaActionEvent
} from './chat-types';
import type { TelecomApiResponse, TelecomRecord, TelecomView } from '@/lib/types';
import { cn, makeId } from './chat-utils';

const nowIso = () => new Date().toISOString();
const ts = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

const GH_REPO = 'RoyHolzem/LiveCenter-Simple';
const GH_BRANCH = 'staging';
const CT_POLL_INTERVAL = 15000;
const TELECOM_REFRESH_INTERVAL = 60000;

const VIEW_META: Array<{ key: TelecomView; label: string; subtitle: string }> = [
  { key: 'incidents', label: 'Incidents', subtitle: 'Live faults and degradations' },
  { key: 'events', label: 'Events', subtitle: 'Operational updates and notices' },
  { key: 'planned-works', label: 'Planned works', subtitle: 'Scheduled maintenance windows' },
];

const emptyData: Record<TelecomView, TelecomRecord[]> = {
  incidents: [],
  events: [],
  'planned-works': [],
};

const emptyLoading: Record<TelecomView, boolean> = {
  incidents: false,
  events: false,
  'planned-works': false,
};

const emptyErrors: Record<TelecomView, string | null> = {
  incidents: null,
  events: null,
  'planned-works': null,
};

const emptySelected: Record<TelecomView, string | null> = {
  incidents: null,
  events: null,
  'planned-works': null,
};

const emptyLoadedAt: Record<TelecomView, string | null> = {
  incidents: null,
  events: null,
  'planned-works': null,
};

function formatDateTime(value: string, withSeconds = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
}

function formatRelative(value: string) {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return '—';
  const diffMinutes = Math.round((date - Date.now()) / 60000);
  const abs = Math.abs(diffMinutes);
  if (abs < 60) return diffMinutes >= 0 ? `in ${abs}m` : `${abs}m ago`;
  const hours = Math.round(abs / 60);
  if (hours < 24) return diffMinutes >= 0 ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return diffMinutes >= 0 ? `in ${days}d` : `${days}d ago`;
}

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (['CLOSED', 'RESOLVED', 'COMPLETED'].includes(value)) return 'ok';
  if (['IN_EXECUTION', 'IN_PROGRESS', 'ACTIVE', 'ACKNOWLEDGED', 'READY'].includes(value)) return 'warn';
  if (['POSTPONED'].includes(value)) return 'muted';
  return 'neutral';
}

function severityTone(severity: string) {
  if (severity === 'SEV1') return 'critical';
  if (severity === 'SEV2') return 'high';
  if (severity === 'SEV3') return 'medium';
  return 'low';
}

function summaryLabel(view: TelecomView) {
  if (view === 'incidents') return 'Open / live';
  if (view === 'events') return 'Active updates';
  return 'Upcoming windows';
}

function summaryValue(view: TelecomView, records: TelecomRecord[]) {
  const activeStatuses =
    view === 'incidents'
      ? new Set(['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'MONITORING'])
      : view === 'events'
        ? new Set(['INFO', 'ACTIVE', 'MONITORING'])
        : new Set(['PLANNED', 'APPROVED', 'CUSTOMER_NOTIFIED', 'READY', 'IN_EXECUTION']);
  return records.filter((record) => activeStatuses.has(record.status)).length;
}

function buildSearch(record: TelecomRecord) {
  return [
    record.title,
    record.summary,
    record.status,
    record.severity,
    record.priority,
    record.typeCode,
    record.companyName,
    record.customerName,
    record.customerContactName,
    record.customerEmail,
    record.customerPhone,
    record.city,
    record.networkRegion,
    record.networkCountry,
    record.operatorName,
    record.serviceType,
    record.networkSegment,
    record.fiberId,
    record.circuitId,
    record.siteCode,
    record.customerText,
    ...record.highlights.map((item) => item.value),
    ...record.facts.map((item) => item.value),
  ].join(' ').toLowerCase();
}

export function ChatShell() {
  const { appName, assistantName } = publicConfig;
  const assistantInitial = assistantName.charAt(0).toUpperCase();
  const getAuthToken = useAuthToken();
  const signOut = useSignOut();
  const currentUser = useCurrentUser();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content: `Hi Roy. I pulled in the Luxembourg telecom tables and I can help you inspect or explain anything you see here.`,
      createdAt: nowIso()
    }
  ]);
  const [draft, setDraft] = useState('');
  const [presence, setPresence] = useState<PresenceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeView, setActiveView] = useState<TelecomView>('incidents');
  const [search, setSearch] = useState('');
  const [telecomData, setTelecomData] = useState<Record<TelecomView, TelecomRecord[]>>(emptyData);
  const [telecomLoading, setTelecomLoading] = useState<Record<TelecomView, boolean>>(emptyLoading);
  const [telecomError, setTelecomError] = useState<Record<TelecomView, string | null>>(emptyErrors);
  const [telecomLoadedAt, setTelecomLoadedAt] = useState<Record<TelecomView, string | null>>(emptyLoadedAt);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Record<TelecomView, string | null>>(emptySelected);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [ghStatus, setGhStatus] = useState<'connected' | 'checking' | 'error'>('checking');
  const [ghCommit, setGhCommit] = useState<string>('-');
  const [awsStatus, setAwsStatus] = useState<'connected' | 'checking' | 'error'>('checking');

  const seenActionIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const assistantBufferRef = useRef('');

  const addAction = useCallback((entry: { id?: string; timestamp: string; verb: string; category: string; label: string; resource?: string; region?: string; detail?: string }, source: ActionSource) => {
    const id = entry.id || makeId();
    if (seenActionIds.current.has(id)) return;
    seenActionIds.current.add(id);
    setActionLog((prev) => [...prev, { ...entry, id, source }]);
  }, []);

  const addXenaAction = useCallback((event: XenaActionEvent) => {
    addAction({
      timestamp: event.timestamp || ts(),
      verb: event.verb,
      category: event.category,
      label: event.label,
      resource: event.resource,
      region: event.region,
      detail: event.detail,
    }, 'xena');
  }, [addAction]);

  const loadTelecomView = useCallback(async (view: TelecomView, force = false) => {
    if (!force && telecomData[view].length > 0) return;

    setTelecomLoading((prev) => ({ ...prev, [view]: true }));
    setTelecomError((prev) => ({ ...prev, [view]: null }));

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Missing auth token');

      const response = await fetch(`/api/telecom?view=${view}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const payload = (await response.json()) as TelecomApiResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to load records');
      }

      setTelecomData((prev) => ({ ...prev, [view]: payload.items }));
      setTelecomLoadedAt((prev) => ({ ...prev, [view]: new Date().toISOString() }));
      setSelectedRecordIds((prev) => ({
        ...prev,
        [view]: prev[view] && payload.items.some((item) => item.recordId === prev[view])
          ? prev[view]
          : (payload.items[0]?.recordId ?? null),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load records';
      setTelecomError((prev) => ({ ...prev, [view]: message }));
    } finally {
      setTelecomLoading((prev) => ({ ...prev, [view]: false }));
    }
  }, [getAuthToken, telecomData]);

  useEffect(() => {
    void loadTelecomView(activeView);
  }, [activeView, loadTelecomView]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadTelecomView(activeView, true);
    }, TELECOM_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [activeView, loadTelecomView]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch('/api/aws-activity?minutes=30', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (cancelled) return;
        setAwsStatus('connected');
        if (data.actions) {
          for (const action of data.actions) {
            addAction({
              timestamp: action.timestamp,
              verb: action.verb,
              category: action.category,
              label: action.label,
              resource: action.resource,
              region: action.region,
              detail: action.detail,
            }, 'cloudtrail');
          }
        }
      } catch {
        if (!cancelled) setAwsStatus('error');
      }
    };
    void poll();
    const interval = setInterval(() => void poll(), CT_POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [addAction, getAuthToken]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${GH_REPO}/branches/${GH_BRANCH}`, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (!res.ok) throw new Error('GitHub API error');
        const data = await res.json();
        if (!cancelled) {
          setGhStatus('connected');
          setGhCommit(data.commit?.sha?.slice(0, 7) || '-');
        }
      } catch {
        if (!cancelled) setGhStatus('error');
      }
    };
    void check();
    const interval = setInterval(() => void check(), 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  }, [draft]);

  const avatarState: AvatarState = useMemo(() => {
    if (presence === 'typing') return 'speaking';
    if (presence === 'processing') return 'thinking';
    if (presence === 'error') return 'error';
    if (isFocused || Boolean(draft.trim())) return 'listening';
    return 'idle';
  }, [draft, isFocused, presence]);

  const statusLabel = useMemo(() => {
    switch (avatarState) {
      case 'speaking': return 'Responding';
      case 'thinking': return 'Thinking';
      case 'listening': return 'Listening';
      case 'error': return 'Error';
      default: return 'Online';
    }
  }, [avatarState]);

  const records = telecomData[activeView];
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => buildSearch(record).includes(term));
  }, [records, search]);

  useEffect(() => {
    if (!filteredRecords.length) return;
    const selectedId = selectedRecordIds[activeView];
    if (!selectedId || !filteredRecords.some((record) => record.recordId === selectedId)) {
      setSelectedRecordIds((prev) => ({ ...prev, [activeView]: filteredRecords[0].recordId }));
    }
  }, [activeView, filteredRecords, selectedRecordIds]);

  const selectedRecord = useMemo(() => {
    const selectedId = selectedRecordIds[activeView];
    return filteredRecords.find((record) => record.recordId === selectedId) || filteredRecords[0] || null;
  }, [activeView, filteredRecords, selectedRecordIds]);

  const summaryCards = useMemo(() => {
    const regions = new Set(records.map((record) => record.networkRegion)).size;
    const critical = records.filter((record) => record.severity === 'SEV1').length;
    const operators = new Set(records.map((record) => record.operatorName)).size;
    return [
      { label: 'Total records', value: String(records.length), hint: 'loaded from DynamoDB' },
      { label: summaryLabel(activeView), value: String(summaryValue(activeView, records)), hint: 'currently relevant' },
      { label: 'SEV1 / critical', value: String(critical), hint: 'highest severity' },
      { label: 'Operators / regions', value: `${operators} / ${regions}`, hint: 'Lux coverage spread' },
    ];
  }, [activeView, records]);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || presence === 'processing' || presence === 'typing') return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content, createdAt: nowIso() };
    const assistantMessageId = makeId();
    assistantBufferRef.current = '';
    setError(null);
    setDraft('');
    setPresence('processing');

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantMessageId, role: 'assistant', content: '', createdAt: nowIso() }
    ]);

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'openclaw',
          stream: true,
          messages: [
            ...messages
              .filter((message) => message.role === 'user' || message.role === 'assistant')
              .map((message) => ({ role: message.role, content: message.content })),
            { role: 'user', content }
          ]
        })
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || `Server error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          const line = chunk.split('\n').find((entry) => entry.startsWith('data:'));
          if (!line) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === '[DONE]') {
            setPresence('idle');
            continue;
          }

          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'action') {
              addXenaAction(parsed as XenaActionEvent);
              continue;
            }
            const delta = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content;
            if (delta) {
              setPresence('typing');
              assistantBufferRef.current += delta;
              const text = assistantBufferRef.current;
              setMessages((current) => current.map((message) => (
                message.id === assistantMessageId ? { ...message, content: text } : message
              )));
            }
          } catch {
            // ignore non-json chunks
          }
        }
      }

      setPresence('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPresence('error');
      setError(message);
      setMessages((current) =>
        current.map((messageItem) =>
          messageItem.id === assistantMessageId
            ? { ...messageItem, content: `I hit an error while contacting the gateway.

${message}` }
            : messageItem
        )
      );
    }
  }, [draft, messages, presence, addXenaAction, getAuthToken]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.closest('form')?.requestSubmit();
    }
  }, []);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div>
            <div className={styles.brandTitle}>{appName}</div>
            <div className={styles.brandSub}>Staging network operations console</div>
          </div>
          <div className={styles.stageBadge}>Luxembourg</div>
        </div>

        <div className={styles.avatarCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarCircle}>{assistantInitial}</div>
            <div className={cn(styles.statusRing, styles[avatarState])} />
            <div className={cn(styles.statusDot, styles[avatarState])} />
          </div>
          <div>
            <div className={styles.avatarName}>{assistantName}</div>
            <div className={cn(styles.liveBadge, styles[avatarState])}>{statusLabel}</div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.cardLabel}>Session</div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}><span>User</span><strong>{currentUser?.email || '—'}</strong></div>
            <div className={styles.infoRow}><span>Messages</span><strong>{messages.length}</strong></div>
            <div className={styles.infoRow}><span>Focused view</span><strong>{VIEW_META.find((item) => item.key === activeView)?.label}</strong></div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.cardLabel}>Connections</div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span>GitHub</span>
              <strong className={cn(styles.statusPill, styles[`status_${ghStatus}`])}>{ghStatus === 'connected' ? 'Connected' : ghStatus === 'checking' ? 'Checking' : 'Error'}</strong>
            </div>
            <div className={styles.infoRow}><span>Branch</span><strong>{GH_BRANCH}</strong></div>
            <div className={styles.infoRow}><span>Commit</span><strong>{ghCommit}</strong></div>
            <div className={styles.infoRow}>
              <span>AWS activity</span>
              <strong className={cn(styles.statusPill, styles[`status_${awsStatus}`])}>{awsStatus === 'connected' ? 'Live' : awsStatus === 'checking' ? 'Connecting' : 'Error'}</strong>
            </div>
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.cardLabel}>Recent activity</div>
          <div className={styles.activityList}>
            {actionLog.length === 0 ? (
              <div className={styles.emptyState}>Waiting for Xena or CloudTrail activity…</div>
            ) : (
              [...actionLog].slice(-8).reverse().map((entry) => (
                <div key={entry.id} className={styles.activityItem}>
                  <div className={styles.activityHead}>
                    <span className={cn(styles.activityVerb, styles[`tone_${severityTone(entry.verb === 'deleted' ? 'SEV1' : 'SEV3')}`])}>{entry.verb}</span>
                    <time>{entry.timestamp}</time>
                  </div>
                  <div className={styles.activityLabel}>{entry.label}</div>
                  <div className={styles.activityMeta}>{entry.category}{entry.resource ? ` · ${entry.resource}` : ''}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <button onClick={signOut} className={styles.signOutBtn}>Sign out</button>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1>Luxembourg telecom operations</h1>
            <p>Switch between incidents, events and planned works, all backed by the DynamoDB staging tables you asked me to seed.</p>
          </div>
          <div className={styles.topbarMeta}>
            <div className={styles.topbarTag}>Staging</div>
            <div className={styles.topbarTag}>Dynamo-backed</div>
            <div className={styles.topbarTag}>Live auth</div>
          </div>
        </header>

        <div className={styles.workspace}>
          <section className={styles.operationsPanel}>
            <div className={styles.viewSwitcher}>
              {VIEW_META.map((view) => (
                <button
                  key={view.key}
                  className={cn(styles.viewButton, activeView === view.key && styles.activeViewButton)}
                  onClick={() => setActiveView(view.key)}
                  type="button"
                >
                  <span>{view.label}</span>
                  <small>{view.subtitle}</small>
                </button>
              ))}
            </div>

            <div className={styles.toolbar}>
              <label className={styles.searchWrap}>
                <span>Search records</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Company, city, fiber ID, service, contact…"
                />
              </label>
              <div className={styles.toolbarMeta}>
                <div className={styles.lastUpdated}>
                  {telecomLoadedAt[activeView] ? `Updated ${formatRelative(telecomLoadedAt[activeView] || '')}` : 'Not loaded yet'}
                </div>
                <button className={styles.refreshButton} type="button" onClick={() => void loadTelecomView(activeView, true)}>
                  Refresh view
                </button>
              </div>
            </div>

            <div className={styles.summaryGrid}>
              {summaryCards.map((card) => (
                <article key={card.label} className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>{card.label}</div>
                  <div className={styles.summaryValue}>{card.value}</div>
                  <div className={styles.summaryHint}>{card.hint}</div>
                </article>
              ))}
            </div>

            <div className={styles.recordsLayout}>
              <div className={styles.recordListPanel}>
                <div className={styles.panelHead}>
                  <div>
                    <h2>{VIEW_META.find((item) => item.key === activeView)?.label}</h2>
                    <p>{filteredRecords.length} visible of {records.length} total rows</p>
                  </div>
                </div>

                <div className={styles.recordScroller}>
                  {telecomLoading[activeView] ? (
                    <div className={styles.emptyState}>Loading {activeView} from DynamoDB…</div>
                  ) : telecomError[activeView] ? (
                    <div className={styles.emptyState}>Couldn’t load data: {telecomError[activeView]}</div>
                  ) : filteredRecords.length === 0 ? (
                    <div className={styles.emptyState}>No records match that search.</div>
                  ) : (
                    filteredRecords.map((record) => (
                      <button
                        key={record.recordId}
                        type="button"
                        className={cn(styles.recordCard, selectedRecord?.recordId === record.recordId && styles.recordCardActive)}
                        onClick={() => setSelectedRecordIds((prev) => ({ ...prev, [activeView]: record.recordId }))}
                      >
                        <div className={styles.recordHead}>
                          <div className={styles.recordBadges}>
                            <span className={cn(styles.severityBadge, styles[`tone_${severityTone(record.severity)}`])}>{record.severity}</span>
                            <span className={cn(styles.statusBadge, styles[`statusTone_${statusTone(record.status)}`])}>{record.status.replaceAll('_', ' ')}</span>
                          </div>
                          <time>{formatRelative(record.updatedAt)}</time>
                        </div>
                        <div className={styles.recordTitle}>{record.title}</div>
                        <div className={styles.recordSummary}>{record.summary}</div>
                        <div className={styles.recordMeta}>{record.companyName} · {record.serviceType}</div>
                        <div className={styles.recordMeta}>{record.city}, {record.networkRegion} · {record.fiberId}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.detailPanel}>
                {selectedRecord ? (
                  <>
                    <div className={styles.panelHead}>
                      <div>
                        <h2>{selectedRecord.title}</h2>
                        <p>{selectedRecord.recordId} · {selectedRecord.operatorName}</p>
                      </div>
                    </div>

                    <div className={styles.detailHero}>
                      <div className={styles.detailHeroTop}>
                        <span className={cn(styles.severityBadge, styles[`tone_${severityTone(selectedRecord.severity)}`])}>{selectedRecord.severity}</span>
                        <span className={cn(styles.statusBadge, styles[`statusTone_${statusTone(selectedRecord.status)}`])}>{selectedRecord.status.replaceAll('_', ' ')}</span>
                        <span className={styles.detailPriority}>{selectedRecord.priority}</span>
                      </div>
                      <div className={styles.detailSummary}>{selectedRecord.summary}</div>
                      <div className={styles.detailTiming}>
                        <span>Start {formatDateTime(selectedRecord.startTime)}</span>
                        <span>{selectedRecord.endTime ? `End ${formatDateTime(selectedRecord.endTime)}` : `Updated ${formatDateTime(selectedRecord.updatedAt)}`}</span>
                      </div>
                    </div>

                    <div className={styles.infoGrid}>
                      {selectedRecord.highlights.map((item) => (
                        <div key={`${selectedRecord.recordId}-${item.label}`} className={styles.infoTile}>
                          <div className={styles.infoTileLabel}>{item.label}</div>
                          <div className={styles.infoTileValue}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.noticeCard}>
                      <div className={styles.cardLabel}>Customer notice</div>
                      <p>{selectedRecord.customerText}</p>
                    </div>

                    <div className={styles.factSection}>
                      <div className={styles.cardLabel}>Network and contact details</div>
                      <div className={styles.factList}>
                        {selectedRecord.facts.map((fact) => (
                          <div key={`${selectedRecord.recordId}-${fact.label}`} className={styles.factRow}>
                            <span>{fact.label}</span>
                            <strong>{fact.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>Select a record to inspect the full detail panel.</div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.chatPanel}>
            <div className={styles.panelHead}>
              <div>
                <h2>Ask {assistantName}</h2>
                <p>Use chat for follow-up, triage notes, or next-step questions.</p>
              </div>
            </div>

            <div className={styles.messages} role="log" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={cn(styles.message, styles[message.role])}>
                  <div className={styles.msgAvatar}>{message.role === 'user' ? 'R' : assistantInitial}</div>
                  <div className={styles.msgBody}>
                    <div className={styles.msgRole}>{message.role === 'user' ? 'Roy' : assistantName}</div>
                    <div className={styles.msgBubble}>
                      {message.content || (
                        <div className={styles.typing}><span /><span /><span /></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.composer} onSubmit={handleSubmit}>
              {error && <div className={styles.errorBanner}>{error}</div>}
              <textarea
                ref={textareaRef}
                className={styles.input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${assistantName} about the selected ${activeView.slice(0, -1)}…`}
                rows={1}
              />
              <div className={styles.composerFooter}>
                <span>Shift + Enter for newline</span>
                <button className={styles.sendButton} type="submit" disabled={!draft.trim() || presence === 'processing' || presence === 'typing'}>
                  Send
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
