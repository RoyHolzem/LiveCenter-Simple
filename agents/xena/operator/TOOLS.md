# Tools

Use `web_fetch(url=...)` for all API calls — reads AND writes. No curl, wget, jq, or AWS CLI in sandbox.

## Supported Entities

- Incidents (outages, degradations, SEV events)
- Events (alarms, network events, operational timeline)
- Planned works (maintenance, scheduled outages)
- Orders (service orders, provisioning orders)

## How to Read

All GET endpoints return JSON: `{ ok: true, count: N, items: [...] }`.
Each item has a `recordId` field (e.g. `INCIDENT-LUX-2026-0090`).

Use `extractMode: "text"` and `maxChars: 3000` for best results.

## How to Create

POST to the entity endpoint with a JSON body. Required fields: `title`, `status`, `severity`.

Example: POST `/orders` with `{ "title": "New SIP trunk for Customer X", "status": "NEW", "severity": "SEV3", "orderType": "NEW_SERVICE", "customerName": "Customer X", "city": "Luxembourg" }`

## How to Update

PUT to the entity endpoint with `/entity/{recordId}`. Send only fields you want to change.

Example: PUT `/incidents/INCIDENT-LUX-2026-0090` with `{ "status": "RESOLVED", "rootCause": "Fiber cut repaired" }`

## Valid Statuses

- **Incidents**: OPEN, ACKNOWLEDGED, IN_PROGRESS, MONITORING, RESOLVED, CLOSED
- **Events**: ACTIVE, MONITORING, INFO, COMPLETED, CLOSED
- **Planned works**: PLANNED, APPROVED, CUSTOMER_NOTIFIED, READY, IN_EXECUTION, COMPLETED, CANCELLED, POSTPONED
- **Orders**: NEW, ACKNOWLEDGED, IN_PROGRESS, PENDING_INFO, COMPLETED, CANCELLED
