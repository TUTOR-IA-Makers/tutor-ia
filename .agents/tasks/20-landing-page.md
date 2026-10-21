# 20 — G5-2 Landing page pública

- **Branch** `feat/20-landing-page`
- **Issue** #20
- **Started** 2026-10-16
- **Driver** Diih-Olivv

## Goal

A visitor who opens `/` understands in 30 seconds what CodeExpert does, for whom,
and what it does not do, and finds how to request access and the documentation.
Today `/` only redirects to `/biblioteca`.

## Out of scope

- The invite system (G8-1). The call to action links to a docs page; it does not
  create accounts or collect data.
- The 2-minute demo video (G5-3).
- Any colour or brand change: the identity from G5-1 stays as it is.

## Constraints

- `docs/design/identidade.md`: no shadows, gradients, glow or sparkle icons;
  animate only colour/position tied to progress; reduced motion zeroes durations.
- CSP (`vite.config.ts`): no external forms or iframes; plain links only.
- Stylelint: tokens only, no `transition`/`animation` shorthands.
- AGENTS.md rule 4: the demo shows expected outputs coming from execution.

## Plan

- [x] Public layout and `/` route, separate from the app navbar
- [x] Blue hero with a live generator demo, "faz / não faz", closing call
- [x] Tokens `--text-display`, `--text-3xl`, `--space-16`, `--space-24` + identity page
- [x] Docs page `guides/request-access.md` + nav
- [x] Unit tests (page, demo, routes) and e2e/a11y specs updated
- [ ] Team e-mail in `request-access.md` (currently "A confirmar")
- [ ] Landing screenshot in `docs/design/telas/` and section 12 of the identity page

## Decisions taken along the way

- Coded demo instead of a video (identity D8). A scroll-driven version was built
  first and dropped after review: not eye-catching enough.
- Demo outputs were obtained by compiling the three solutions with
  `gcc -std=c11 -Wall -Wextra` and running them (AGENTS.md rule 4).
- Landing body text uses `--color-text` and nothing below 16px outside code.
- The hero has no entrance animation: the identity only allows motion tied to an
  action or to progress.
- "Para quem é" lives in the hero eyebrow and the closing call, not in a separate
  section, to avoid repeating the hero.

## Verification

<make check / make front-e2e output>
