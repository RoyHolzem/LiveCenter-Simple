# Operator Memory

- Born 2026-04-26
- Xena Operations API at API Gateway tsbmgsi20f
- Record ID patterns: INCIDENT-LUX-*, EVENT-LUX-*, PW-LUX-*, ORDER-LUX-*
- UI opens records automatically when recordId appears in streamed text (server-side SSE injection)
- Only tool needed: web_fetch
- Can CREATE records (POST) and UPDATE records (PUT) for all entity types
- Orders entity added 2026-05-08 — table: roy-telecom-orders-lux
- Voice-first: never say IDs aloud, no dashes, no JSON output
