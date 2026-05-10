# Xena Repository Instructions

## Canonical UI design contract

Before changing UI code, read `docs/ui-design-system.md`.

The current Xena UI is the post-refactor visual system. Do **not** restore the pre-refactor landing page, the old neon/gradient-square `X` branding, or the legacy multi-section marketing page unless the user explicitly asks for that exact rollback.

When editing UI files:
- Preserve the reusable `XenaLogo` component as the source of truth for brand marks.
- Preserve the focused landing page built around the `app.xena.lu` showcase card.
- Preserve the Xena logo palette: red `#e30016`, blue `#0799eb`, and ink `#0b1d31`.
- Preserve the light glitch/beam background effects and the delayed showcase-card reveal behavior.
- Preserve the main-app glass-panel refresh and circular textless loading/boot spinners.
- If you touch `features/chat/chat-shell.module.css`, keep the `Xena 2026 Bootstrap-first visual refresh` section canonical. Do not delete it or move old definitions after it unless you fully replace them with an equivalent implementation of the same design.
