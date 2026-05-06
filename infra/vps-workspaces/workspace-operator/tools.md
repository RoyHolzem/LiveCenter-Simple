# Tools

Use `web_fetch(url=...)` for all API calls. No curl, wget, jq, or AWS CLI in sandbox.

## Supported Entities

- Incidents (outages, degradations, SEV events)
- Events (alarms, network events, operational timeline)
- Planned works (maintenance, scheduled outages)

## How to Query

All endpoints return JSON: `{ ok: true, count: N, items: [...] }`.
Each item has a `recordId` field (e.g. `INCIDENT-LUX-2026-0090`).

Use `extractMode: "text"` and `maxChars: 3000` for best results.
