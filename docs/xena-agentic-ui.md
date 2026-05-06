# Xena agentic UI architecture

## 1. Purpose

Xena’s **Xena mode** (three-column cockpit) is an **agentic operations interface**: the human drives intent through chat (and voice); the **Xena Operator** (behind OpenClaw) decides when to call tools and APIs; the **browser** updates navigation, search results, and the detail panel only from **structured `uiActions`**, never from parsing assistant prose.

## 2. Previous behavior

- A hardcoded assistant welcome message appeared on every load.
- Telecom data for the active view was fetched on mount and the **first row** was auto-selected, so the right panel always showed a record before the user asked.
- Optional `telecom_focus` SSE lines could move selection, but there was no first-class action catalog or search-results surface.

## 3. New behavior

- **Empty chat** until the user sends a message (no seed assistant bubble).
- **No telecom preload** in Xena mode: `useTelecom` is configured with `autoLoadOnMount: false` and `enablePolling: false` until the agent triggers loads via UI actions (through `focusRecord` / fetches).
- **Right panel** shows “No operational record selected.” until an `OPEN_*` / `SHOW_*` action (or user picks a search row) loads a record.
- **Left panel** shows neutral context copy until `SHOW_SEARCH_RESULTS` or a selection exists; context tabs still switch domain (incidents / events / maintenance) for the next command.
- **Agent activity** bar appears when the operator emits `SET_AGENT_ACTIVITY` and clears on `CLEAR_AGENT_ACTIVITY` or `CLEAR_CONTEXT`.
- **Module dashboard** (top nav Incidents / Events / Maintenance) keeps **auto load + polling** for traditional browsing.

## 4. Agent response contract (logical vs transport)

**Logical turn result** (what the operator “returns” conceptually):

```json
{
  "answer": "Opened INCIDENT-LUX-2026-0053.",
  "uiActions": [
    { "type": "OPEN_INCIDENT", "recordId": "INCIDENT-LUX-2026-0053" }
  ]
}
```

**Transport (recommended):** keep `answer` as normal **streamed** chat tokens (OpenAI-style `choices[].delta.content` in SSE). Emit **`uiActions` only** on separate SSE `data:` lines so the UI never depends on parsing natural language:

```json
{ "type": "xena_ui", "uiActions": [ { "type": "OPEN_INCIDENT", "recordId": "INCIDENT-LUX-2026-0053" } ] }
```

If the gateway batches a single JSON object with both `answer` and `uiActions`, it may still send `answer` as streamed text and attach the same `uiActions` array in a final `xena_ui` line—the frontend does not require a duplicate `answer` field once text has streamed.

## 5. Supported `uiActions`

| Type | Fields | Effect (frontend) |
|------|--------|-------------------|
| `OPEN_INCIDENT` | `recordId` | Set view to incidents, fetch `/api/telecom?view=incidents&recordId=…`, select record |
| `OPEN_EVENT` | `recordId` | Same for events |
| `OPEN_PLANNED_WORK` | `recordId` | Same for planned works |
| `SHOW_INCIDENT` | `recordId` | MVP: same as `OPEN_*` (detail on right) |
| `SHOW_EVENT` | `recordId` | MVP: same |
| `SHOW_PLANNED_WORK` | `recordId` | MVP: same |
| `SHOW_SEARCH_RESULTS` | `entity`: `incident` \| `event` \| `planned-work`, `results[]` | Left list; each row has `recordId`, `title`, `status`, `severity`. If **exactly one** result, auto-open and clear list |
| `CLEAR_CONTEXT` | — | Clear telecom in-memory data, selection, search results, activity |
| `SET_AGENT_ACTIVITY` | `phase`, `message` (or message derived from `phase` if only one is set) | Activity bar text |
| `CLEAR_AGENT_ACTIVITY` | — | Hide activity bar |

**Legacy:** `{ "type": "telecom_focus", "view": "incidents"|"events"|"planned-works", "recordId": "…" }` is still accepted and mapped to the corresponding `OPEN_*` action.

Types live in [`lib/xena-ui-actions.ts`](../lib/xena-ui-actions.ts). Normalization and application: [`features/chat/ui-action-dispatcher.ts`](../features/chat/ui-action-dispatcher.ts).

## 6. Frontend dispatcher behavior

1. **`parseSseDataObject`** ([`features/chat/sse-parse.ts`](../features/chat/sse-parse.ts)) classifies each SSE JSON line: `xena_ui`, legacy `telecom_focus`, `action`, or token `delta`.
2. **`useChat` / `useVoice`** call `onUiActions(actions)` when a `xena_ui` bundle is received (same path for text and voice chat streams).
3. **`useCockpitState`** ([`features/chat/hooks/useCockpitState.ts`](../features/chat/hooks/useCockpitState.ts)) runs **`applyUiActions`**, which updates:
   - `telecom` via `focusRecord` / `clearOperationalContext`
   - left-panel `searchResults`
   - `agentActivity`
   - `setContextView` when needed

Invalid or unknown action objects are dropped by **`normalizeUiActions`**.

## 7. Operations API / tool mapping

| Intent | Browser (Next) | Operator / tools (typical) |
|--------|----------------|----------------------------|
| List / latest / by id (incidents, events, planned works) | `GET /api/telecom?view=…&recordId=` optional | Same data via server tools, or [Xena Operations API](../README.md#xena-operations-api) (`GET /incidents/latest`, etc.) |
| Customer / company / site / service search | **Not implemented** in Next routes yet | Phase 2: extend `/api/telecom` or add proxy routes; **do not** fabricate rows in the client |

The LLM should use tools to compute facts; the UI only reflects **`uiActions`** returned alongside (or after) those tool results.

## 8. Example user flows

1. **“Open latest incident”** — Operator calls ops API or internal tool → streams short answer → emits `xena_ui` with `OPEN_INCIDENT` and the resolved `recordId` → right panel shows detail, left shows selected id card.
2. **“Open incident INCIDENT-LUX-2026-0053”** — Same with explicit id.
3. **“Status of company XYZ”** — Operator searches → emits `SHOW_SEARCH_RESULTS` with multiple rows → user clicks a row → client calls `focusRecord` for that id. If the operator returns a single row, the dispatcher auto-opens and clears the list.

## 9. OpenClaw integration notes

- Inject **one SSE `data:` line** per control payload (or batch multiple actions in one `uiActions` array).
- Use **stable Dynamo `recordId`** strings so `GET /api/telecom?...&recordId=` succeeds.
- Prefer **`xena_ui`** for all new integrations; keep `telecom_focus` only for backward compatibility.
- Drive **activity** UX with `SET_AGENT_ACTIVITY` while tools run (e.g. `{ "type": "SET_AGENT_ACTIVITY", "phase": "search", "message": "Xena is searching incidents…" }`), then `CLEAR_AGENT_ACTIVITY` or `CLEAR_CONTEXT` when done.
