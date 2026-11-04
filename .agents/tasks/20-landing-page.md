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

## Redesign pass (2026-11-03)

Landing reorganised as a narrative: hero, problem, pinned product flow, execution proof,
live demo, scope, FAQ, closing call. Decisions:

- No new dependency. Scroll behaviour is `IntersectionObserver` + CSS `position: sticky`;
  motion is opacity/translate only, once, and off with reduced motion.
- Identity constraints kept (no glow, no shadows, no new colours). Not built on purpose:
  GSAP/parallax/morphing, magnetic buttons, cursor spotlight, animated counters.
- No social-proof section: there are no testimonials, institutions or numbers to show, and none are invented.
- No access form: access is still manual by e-mail (see `request-access.md`), so the CTA stays a link.
- `analytics.ts` publishes `codeexpert:analytics` events on `window`; nothing is sent anywhere.

## Sign-in and sign-up screens (2026-11-03)

Scope added on this branch by decision of the driver, after merging `origin/main` (4b3e2f7).
Out-of-scope note above ("does not create accounts") still holds for the backend: nothing
here talks to a real account store.

- Routes `/entrar` and `/criar-conta` under a lazy `AuthLayout` (split screen, single column
  below 1024px). Header of the public layout gains an "Entrar" link.
- Brand half reuses `HeroScene` and the hero gradient; logo is `logo-mono.svg` because the
  colour logo fails contrast on blue (1.94). Identity decision D9 records the gradient exception.
- Auth model chosen by the driver: e-mail + password + invite code on sign-up (G8-1).
- Validation runs twice before any request: the form (zod schema via react-hook-form) and the
  submit hook, which re-parses the values. The backend must repeat every rule.
- Password never reaches TanStack's MutationCache (plain state instead of `useMutation`),
  analytics, logs or query keys. Session is meant to be an HttpOnly cookie; `login` and
  `register` resolve `void`.
- Errors are generic (401 and every sign-up refusal say nothing about which field was wrong).
  Five failures in a row lock the button for 30 s; this is UX, the real limit is the backend's.
- `?proximo=` goes through `safeNextPath` and never back to an auth page.
- Google and GitHub buttons are mocks: inline SVG, `type="button"`, a status message, no request.
- Mock account (fictitious, reserved domain): `professora@exemplo.com` / `demo-codeexpert`,
  invite `DEMO-2026`. Not shown in the UI, to keep fixtures out of the http entry chunk.
- Removed unused `--color-demo-action*` tokens (white on it was 3.02); added white on
  `--color-closing-blue` (6.40) to `contrast.mjs`.

Still to do on this branch: independent review (security, validation, a11y) and the
backend integration plan in `docs/architecture/` + ADR draft.

## Verification

<make check / make front-e2e output>
