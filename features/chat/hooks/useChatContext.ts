'use client';

import { useMemo } from 'react';
import type { ChatMessage, TelecomRecord, TelecomView } from '@/lib/types';

/**
 * Matches the latest assistant message against loaded telecom records.
 *
 * Matching strategy (first match wins):
 *  1. Exact recordId match  ("INC-2026-0421")
 *  2. Circuit / fiber / site code match
 *  3. Fuzzy title / company / city / operator substring match
 *
 * Returns the best-matching record + which view it belongs to,
 * or null if nothing matches.
 */
export function useChatContext(
  messages: ChatMessage[],
  recordsByView: Record<TelecomView, TelecomRecord[]>,
): {
  matchedRecord: TelecomRecord | null;
  matchedView: TelecomView | null;
} {
  return useMemo(() => {
    // Find the last assistant message with content
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.content.trim());

    // Also check last user message (for proactive matching before assistant replies)
    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && m.content.trim());

    const text = [lastAssistant?.content, lastUser?.content]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!text) return { matchedRecord: null, matchedView: null };

    const views: TelecomView[] = ['incidents', 'events', 'planned-works'];

    // Strategy 1: exact recordId
    for (const view of views) {
      for (const rec of recordsByView[view]) {
        const id = rec.recordId.toLowerCase();
        if (id && text.includes(id)) {
          return { matchedRecord: rec, matchedView: view };
        }
      }
    }

    // Strategy 2: circuit / fiber / site codes (exact-ish)
    for (const view of views) {
      for (const rec of recordsByView[view]) {
        const codes = [rec.circuitId, rec.fiberId, rec.siteCode]
          .map((c) => c.toLowerCase())
          .filter((c) => c && c !== '—' && c.length > 2);

        for (const code of codes) {
          // Require word-ish boundary to avoid partial matches
          if (text.includes(code)) {
            return { matchedRecord: rec, matchedView: view };
          }
        }
      }
    }

    // Strategy 3: fuzzy substring match — title, summary, company, city, operator, customer
    // Score each match to pick the best one
    let bestScore = 0;
    let bestRecord: TelecomRecord | null = null;
    let bestView: TelecomView | null = null;

    for (const view of views) {
      for (const rec of recordsByView[view]) {
        let score = 0;

        // Check each field for substring match
        const fields: Array<{ value: string; weight: number }> = [
          { value: rec.title, weight: 10 },
          { value: rec.summary, weight: 5 },
          { value: rec.companyName, weight: 6 },
          { value: rec.customerName, weight: 5 },
          { value: rec.city, weight: 4 },
          { value: rec.operatorName, weight: 4 },
          { value: rec.networkRegion, weight: 3 },
          { value: rec.serviceType, weight: 3 },
          { value: rec.networkSegment, weight: 3 },
          { value: rec.typeCode, weight: 3 },
          ...rec.highlights.map((h) => ({ value: h.value, weight: 2 })),
          ...rec.facts.map((f) => ({ value: f.value, weight: 1 })),
        ];

        for (const field of fields) {
          const fv = field.value.toLowerCase();
          if (!fv || fv === '—') continue;

          // Split field into tokens and check if any token appears in the chat text
          const tokens = fv.split(/[\s,.-]+/).filter((t) => t.length > 2);
          let matchedTokens = 0;
          for (const token of tokens) {
            if (text.includes(token)) matchedTokens++;
          }

          // Require at least 2 matching tokens OR a full substring match for short values
          const tokenRatio = tokens.length > 0 ? matchedTokens / tokens.length : 0;
          if (tokenRatio >= 0.5 || (fv.length > 5 && text.includes(fv))) {
            score += Math.round(field.weight * tokenRatio);
          }
        }

        // Boost if severity or status keywords match
        if (rec.severity !== '—' && text.includes(rec.severity.toLowerCase())) score += 3;
        if (rec.status !== '—' && text.includes(rec.status.replace('_', ' ').toLowerCase())) score += 2;

        if (score > bestScore) {
          bestScore = score;
          bestRecord = rec;
          bestView = view;
        }
      }
    }

    // Only return if we have a meaningful match (threshold)
    if (bestScore >= 6 && bestRecord) {
      return { matchedRecord: bestRecord, matchedView: bestView };
    }

    return { matchedRecord: null, matchedView: null };
  }, [messages, recordsByView]);
}
