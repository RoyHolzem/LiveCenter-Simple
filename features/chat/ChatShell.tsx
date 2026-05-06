'use client';

import { useState, useCallback } from 'react';
import type { XenaUiAction } from '@/lib/xena-ui-actions';
import { publicConfig } from './chat-config';
import { useAuthToken } from '../auth/AuthWrapper';
import { useChat } from './hooks/useChat';
import { useVoice } from './hooks/useVoice';
import { useBootSequence } from './hooks/useBootSequence';
import { useTelecom } from './hooks/useTelecom';
import { useCockpitState } from './hooks/useCockpitState';
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
      // no-op, response fully streamed
    }, []),

    onError: useCallback((err: string) => {
      console.error('[voice]', err);
    }, []),

    onUiActions,
  });

  const boot = useBootSequence();

  const isXenaMode = mode === 'xena';
  const isReady = boot.bootState === 'ready';

  return (
    <div className={styles.shell}>
      {!isReady ? (
        <BootScreen
          bootState={boot.bootState}
          steps={boot.steps}
          progress={boot.progress}
          onStart={boot.startBoot}
          assistantName={assistantName}
          assistantInitial={assistantInitial}
        />
      ) : (
        <>
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
              selectedRecordId={telecom.selectedRecord?.recordId ?? null}
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
              />
            </div>

            <RightPanel
              visible
              selectedRecord={telecom.selectedRecord}
              activeView={contextView}
            />
          </>
        ) : (
          <ModuleDashboard
            view={mode as TelecomView}
            onBackToXena={() => setMode('xena')}
          />
        )}
      </div>
        </>
      )}
    </div>
  );
}
