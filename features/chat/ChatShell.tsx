'use client';

import { useState, useCallback, useEffect } from 'react';
import type { XenaUiAction } from '@/lib/xena-ui-actions';
import { publicConfig } from './chat-config';
import { useAuthToken } from '../auth/AuthWrapper';
import { useChat } from './hooks/useChat';
import { useVoice } from './hooks/useVoice';
import { useBootSequence } from './hooks/useBootSequence';
import { useTelecom } from './hooks/useTelecom';
import { useCockpitState } from './hooks/useCockpitState';
import { useChatContext } from './hooks/useChatContext';
import { useGitHub } from './hooks/useGitHub';
import { useModels } from './hooks/useModels';
import { TopNav, type AppMode } from './components/TopNav';
import { ChatCenter } from './components/ChatCenter';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { ModuleDashboard } from './components/ModuleDashboard';
import { BootScreen } from './components/BootScreen';
import { AgentActivityBar } from './components/AgentActivityBar';

import type { TelecomView } from '@/lib/types';
import styles from './chat-shell.module.css';

const DEFAULT_MODEL = 'inceptionlabs/mercury-2';

export function ChatShell() {
  const { assistantName } = publicConfig;
  const assistantInitial = assistantName.charAt(0).toUpperCase();
  const getAuthToken = useAuthToken();

  const [mode, setMode] = useState<AppMode>('xena');
  const [contextView, setContextView] = useState<TelecomView>('incidents');
  const [search] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);

  const { ghStatus, ghCommit } = useGitHub();
  const { models } = useModels();

  const telecom = useTelecom(contextView, getAuthToken, search, {
    onContextViewChange: setContextView,
    autoLoadOnMount: false,
    enablePolling: false,
  });

  const cockpit = useCockpitState(telecom, setContextView);

  const onUiActions = useCallback(
    (actions: XenaUiAction[]) => {
      void cockpit.dispatchUiActions(actions);
    },
    [cockpit],
  );

  const chat = useChat(selectedModel, { onUiActions });

  const voice = useVoice({
    onUserTranscript: useCallback((text: string) => {
      chat.addVoiceUserMessage(text);
    }, [chat]),

    onResponseStart: useCallback(() => {
      chat.resetVoiceAssistant();
    }, [chat]),

    onAssistantDelta: useCallback((delta: string) => {
      chat.appendVoiceAssistantDelta(delta);
    }, [chat]),

    onResponseDone: useCallback(() => {
      // no-op
    }, []),

    onError: useCallback((err: string) => {
      console.error('[voice]', err);
    }, []),

    onUiActions,
  });

  const boot = useBootSequence();

  // Preload all telecom views on mount so the chat context matcher has data
  useEffect(() => {
    const views: TelecomView[] = ['incidents', 'events', 'planned-works'];
    for (const view of views) {
      void telecom.loadTelecomView(view, true);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chat-driven context: match conversation to telecom records
  const { matchedRecord, matchedView } = useChatContext(
    chat.messages,
    telecom.recordsByView,
  );

  // Sticky context: keep showing the last matched record until a different one is matched.
  // This prevents the context card from disappearing on follow-up messages.
  const [stickyRecord, setStickyRecord] = useState<{ record: typeof matchedRecord; view: typeof matchedView }>({ record: null, view: null });

  useEffect(() => {
    if (matchedRecord && matchedView) {
      // New match — update sticky
      setStickyRecord({ record: matchedRecord, view: matchedView });
    } else if (stickyRecord.record && matchedRecord === null) {
      // No current match but we have a sticky record — check if any recent message still references it
      const lastN = chat.messages.slice(-6);
      const recentText = lastN.map(m => m.content).join(' ').toLowerCase();
      const stickyId = stickyRecord.record.recordId.toLowerCase();
      if (!recentText.includes(stickyId)) {
        // The conversation has moved on — clear sticky
        setStickyRecord({ record: null, view: null });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedRecord, matchedView]);

  // Use live match if available, otherwise fall back to sticky
  const contextRecord = matchedRecord || stickyRecord.record;
  const contextView_ = matchedView || stickyRecord.view;

  // When a record is matched via chat context, override the active view + selection
  useEffect(() => {
    if (contextRecord && contextView_) {
      if (contextView_ !== contextView) {
        setContextView(contextView_);
      }
      telecom.selectRecord(contextView_, contextRecord.recordId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextRecord, contextView_]);

  // The record to show in the right panel: chat context match takes priority
  const displayRecord = contextRecord || telecom.selectedRecord;

  const isXenaMode = mode === 'xena';
  const isReady = boot.bootState === 'ready';

  if (!isReady) {
    return (
      <div className={styles.shell}>
        <BootScreen
          bootState={boot.bootState}
          steps={boot.steps}
          progress={boot.progress}
          onStart={boot.startBoot}
          assistantName={assistantName}
          assistantInitial={assistantInitial}
        />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <TopNav
        mode={mode}
        setMode={setMode}
        ghStatus={ghStatus}
        ghCommit={ghCommit}
        models={models}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        modelFallback={chat.modelFallback}
      />

      <div className={styles.body}>
        {isXenaMode ? (
          <>
            <LeftPanel
              visible
              contextView={contextView}
              onContextViewChange={setContextView}
              searchResults={cockpit.searchResults}
              selectedRecordId={displayRecord?.recordId ?? telecom.selectedRecord?.recordId ?? null}
              onPickSearchResult={(view, recordId) => {
                cockpit.setSearchResults(null);
                void telecom.focusRecord(view, recordId);
              }}
            />

            <div className={styles.chatColumn}>
              <AgentActivityBar activity={cockpit.agentActivity} />
              <ChatCenter
                assistantName={assistantName}
                assistantInitial={assistantInitial}
                avatarState={chat.avatarState}
                statusLabel={chat.statusLabel}
                messages={chat.messages}
                draft={chat.draft}
                setDraft={chat.setDraft}
                presence={chat.presence}
                error={chat.error}
                messagesEndRef={chat.messagesEndRef}
                textareaRef={chat.textareaRef}
                handleSubmit={(e) => chat.handleSubmit(e, getAuthToken)}
                handleKeyDown={chat.handleKeyDown}
                voiceState={voice.state}
                voiceError={voice.error}
                onToggleVoice={voice.toggle}
                voiceActive={voice.isActive}
                matchedRecord={contextRecord}
                matchedView={contextView_}
              />
            </div>

            <RightPanel
              visible
              selectedRecord={displayRecord}
              activeView={contextView_ || contextView}
            />
          </>
        ) : (
          <ModuleDashboard
            view={mode as TelecomView}
            onBackToXena={() => setMode('xena')}
          />
        )}
      </div>
    </div>
  );
}
