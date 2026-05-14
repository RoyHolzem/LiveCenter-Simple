'use client';

import { useCallback } from 'react';
import type { TelecomRecord, TelecomView } from '@/lib/types';
import { useAuthToken } from '@/features/auth/AuthWrapper';

export type MutationResult = {
  ok: boolean;
  recordId?: string;
  item?: TelecomRecord;
  error?: string;
};

export function useTelecomMutation() {
  const getAuthToken = useAuthToken();

  const updateRecord = useCallback(
    async (view: TelecomView, recordId: string, updates: Record<string, unknown>): Promise<MutationResult> => {
      const token = await getAuthToken();
      if (!token) return { ok: false, error: 'Missing auth token' };

      try {
        const res = await fetch(`/api/telecom?view=${view}&recordId=${encodeURIComponent(recordId)}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) return { ok: false, error: data.error || 'Update failed' };
        return { ok: true, recordId: data.recordId, item: data.item };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthToken],
  );

  const createRecord = useCallback(
    async (view: TelecomView, fields: Record<string, unknown>): Promise<MutationResult> => {
      const token = await getAuthToken();
      if (!token) return { ok: false, error: 'Missing auth token' };

      try {
        const res = await fetch(`/api/telecom?view=${view}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) return { ok: false, error: data.error || 'Create failed' };
        return { ok: true, recordId: data.recordId, item: data.item };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
      }
    },
    [getAuthToken],
  );

  return { updateRecord, createRecord };
}
