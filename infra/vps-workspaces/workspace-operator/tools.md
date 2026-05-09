# Tools

## Reading Data

Use `web_fetch(url=...)` for all GET queries. No curl, wget, jq, or AWS CLI in sandbox.

## Creating Records

Use `web_post(url=..., body=...)` to create new records. The body must be a JSON object with at least `title`, `status`, and `severity`.

Example:
```
web_post(url="https://tsbmgsi20f.execute-api.eu-central-1.amazonaws.com/incidents", body={"title": "Fiber cut in Luxembourg City", "status": "OPEN", "severity": "SEV2"})
```

## Updating Records

Use `web_put(url=..., body=...)` to update existing records. Only include fields you want to change.

Example:
```
web_put(url="https://tsbmgsi20f.execute-api.eu-central-1.amazonaws.com/incidents/INCIDENT-LUX-2026-0036", body={"status": "IN_PROGRESS"})
```

## Supported Entities

- Incidents (outages, degradations, SEV events)
- Events (alarms, network events, operational timeline)
- Planned works (maintenance, scheduled outages)
- Orders (service orders, provisioning)

## Response Format

All endpoints return JSON: `{ ok: true, count: N, items: [...] }` for reads, `{ ok: true, recordId: "...", item: {...} }` for writes.

Each item has a `recordId` field (e.g. `INCIDENT-LUX-2026-0090`).

Use `extractMode: "text"` and `maxChars: 3000` for best results with `web_fetch`.
