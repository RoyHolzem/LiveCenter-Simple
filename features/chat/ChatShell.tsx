'use client';

import { useState, useCallback, useEffect } from 'react';
import type { XenaUiAction } from '@/lib/xena-ui-actions';
import type { TelecomView } from '@/lib/types';
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
import { RecordOverlay } from './components/RecordOverlay';
import { ModuleDashboard } from './components/ModuleDashboard';
import { BootScreen } from './components/BootScreen';
import { AgentActivityBar } from './components/AgentActivityBar';
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
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayClosing, setOverlayClosing] = useState(false);

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

  const chat = useChat(selectedModel, {
    onUiActions,
    onResponseDone: useCallback(() => {
      void telecom.loadTelecomView(contextView, true);
    }, [contextView, telecom]),
  });

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
    onResponseDone: useCallback(() => {}, []),
    onError: useCallback((err: string) => {
      console.error('[voice]', err);
    }, []),
    onUiActions,
  });

  const boot = useBootSequence();

  // Preload all telecom views on mount
  useEffect(() => {
    const views: TelecomView[] = ['incidents', 'events', 'planned-works'];
    for (const view of views) {
      void telecom.loadTelecomView(view, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chat-driven context matching
  const { matchedRecord, matchedView } = useChatContext(
    chat.messages,
    telecom.recordsByView,
  );

  // When a record is matched, select it and open overlay
  useEffect(() => {
    if (matchedRecord && matchedView) {
      if (matchedView !== contextView) {
        setContextView(matchedView);
      }
      telecom.selectRecord(matchedView, matchedRecord.recordId);
      setOverlayOpen(true);
      setOverlayClosing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedRecord, matchedView]);

  // The record to show: chat context match takes priority
  const displayRecord = matchedRecord || telecom.selectedRecord;
  const activeView = matchedView || contextView;

  const closeOverlay = useCallback(() => {
    setOverlayClosing(true);
    setTimeout(() => {
      setOverlayOpen(false);
      setOverlayClosing(false);
    }, 200);
  }, []);

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
              selectedRecordId={displayRecord?.recordId ?? null}
              onPickSearchResult={(view, recordId) => {
                cockpit.setSearchResults(null);
                void telecom.focusRecord(view, recordId);
                setOverlayOpen(true);
                setOverlayClosing(false);
              }}
              records={telecom.filteredRecords}
              onPickRecord={(view, recordId) => {
                void telecom.focusRecord(view, recordId);
                setOverlayOpen(true);
                setOverlayClosing(false);
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
                matchedRecord={matchedRecord}
                matchedView={matchedView}
              />
            </div>

            {/* Floating record overlay — replaces the permanent right panel */}
            {overlayOpen && displayRecord && (
              <div className={`${styles.recordOverlay} ${styles.recordOverlayVisible}`}>
                <div className={styles.recordOverlayBackdrop} onClick={closeOverlay} />
                <div className={`${styles.recordOverlayCard} ${overlayClosing ? styles.recordOverlayCardClosing : ''}`}>
                  <RecordOverlay
                    record={displayRecord}
                    view={activeView}
                    onClose={closeOverlay}
                  />
                </div>
              </div>
            )}
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
