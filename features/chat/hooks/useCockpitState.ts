'use client';

import { useCallback, useState } from 'react';
import type { TelecomView } from '@/lib/types';
import type { XenaEntityKind, XenaSearchResultRow, XenaUiAction } from '@/lib/xena-ui-actions';
import { applyUiActions } from '../ui-action-dispatcher';

export type AgentActivityState = { phase: string; message: string } | null;

export type SearchResultsState = {
  entity: XenaEntityKind;
  results: XenaSearchResultRow[];
} | null;

type TelecomCockpitApi = {
  focusRecord: (view: TelecomView, recordId: string) => Promise<void>;
  clearOperationalContext: () => void;
};

export function useCockpitState(telecom: TelecomCockpitApi, setContextView: (view: TelecomView) => void) {
  const [agentActivity, setAgentActivity] = useState<AgentActivityState>(null);
  const [searchResults, setSearchResults] = useState<SearchResultsState>(null);

  const dispatchUiActions = useCallback(
    async (actions: XenaUiAction[]) => {
      await applyUiActions(actions, {
        focusRecord: telecom.focusRecord,
        clearOperationalContext: telecom.clearOperationalContext,
        setContextView,
        setAgentActivity,
        setSearchResults,
      });
    },
    [telecom.focusRecord, telecom.clearOperationalContext, setContextView],
  );

  return {
    agentActivity,
    searchResults,
    setSearchResults,
    setAgentActivity,
    dispatchUiActions,
  };
}
