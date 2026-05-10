# Xena UI Design System

This document is the source-of-truth design contract for LLMs and contributors working on the Xena UI.

## Do not revert the refactor

The current UI is the post-refactor Xena design. Do **not** restore:

- the old multi-section landing page,
- the old gradient-square text `X` logo,
- the old teal/cyan-only neon palette,
- text-heavy loading screens after sign-in,
- or pre-refactor main-app panel styling.

If a requested change touches UI files, preserve the current design unless the user explicitly asks to roll back to the old design.

## Brand system

Use these logo-derived colors as the canonical palette:

| Token | Value | Usage |
| --- | --- | --- |
| Xena red | `#e30016` | Critical accents, logo red, gradient endpoints |
| Xena blue | `#0799eb` | Primary actions, logo blue, links, active UI |
| Xena ink | `#0b1d31` | Wordmark, dark gradients, high-contrast text |

The reusable `XenaLogo` component is the source of truth for the logo and wordmark. Use it instead of rebuilding an `X` mark with text or CSS.

## Landing page contract

The landing page must remain focused and minimal:

- Keep the `app.xena.lu` browser/showcase card.
- Keep the showcase chat as the primary content.
- Keep the CTA/access card appearing only after the chat animation finishes.
- Keep light glitch/grid and beam effects in the background.
- Bootstrap utility classes are encouraged for layout and buttons; avoid rebuilding a large custom marketing page.

## Auth and boot loading

- The unauthenticated auth-check loading state should be a circular animated loader with no text.
- The post-sign-in booting state should also be a circular animated loader with no text.
- The boot idle and error states may still show controls/details so the user can start or retry the warmup sequence.

## Main app contract

The authenticated app should keep the Xena 2026 visual refresh:

- glassy rounded panels,
- subtle glitch/grid shell background,
- logo-derived red/blue accents,
- Xena logo in top nav and assistant avatars,
- pill-shaped nav/tabs/buttons where practical,
- clean chat center with rounded composer and operational side panels.

`features/chat/chat-shell.module.css` still contains structural styles for many existing components. The `Xena 2026 Bootstrap-first visual refresh` block is the canonical visual override layer. If you refactor this file, integrate those rules into the main definitions rather than deleting them.

## Safe-edit checklist for LLMs

Before committing UI changes:

1. Confirm `XenaLogo` is still used in the landing page, top nav, boot screen, and assistant avatar surfaces.
2. Confirm the landing page still includes `app.xena.lu` and the delayed access card reveal.
3. Confirm loading/booting still use circular textless spinners.
4. Confirm the Xena red/blue/ink palette remains in global tokens and UI CSS.
5. Run `npm run lint` at minimum.
