# 2026-07-09 historical handoff — security review hardening

> **Historical pre-fix handoff:** the unfinished work recorded below was completed and shipped. The release-level closure is documented in [`2026-07-11-open-source-v0.1.1.md`](2026-07-11-open-source-v0.1.1.md).

## Live-state references

- Production URL: `https://braga-ai-builders.vercel.app`
- Braga production repository: `https://github.com/richkapp/braga-ai-builders`
- Canonical upstream: `https://github.com/richkapp/local-community-platform`
- Supabase project: maintainer-controlled production project
- Historical baseline commit before this WIP: `9d7ad6c`

## Why this exists

Three review agents found pre-ship issues after the first deployment. The critical/high findings to preserve:

1. **Self-service admin escalation** — members can update `profiles.role` and become admin unless role updates are blocked server-side.
2. **Public invite bypass** — public links and seed data expose `braga-whatsapp`, making signup effectively public.
3. **Invite race/cooldown gap** — Edge Function validates invite, sends email, then increments `uses_count`; concurrent requests can oversubscribe and repeated requests are not throttled well.
4. **Profile URL XSS** — profile URL fields need server-side `https?://` constraints and safe external-link rendering.
5. **Event registration bypass** — direct table inserts can register for draft/closed/full/completed events unless routed through a guarded RPC.
6. **Aggregate view/runtime mismatch** — React islands embedded plain views as PostgREST relationships; browsers likely fail unless counts are queried separately or exposed via supported relationships/RPC.
7. **Missing not-found states** — bad idea/event slugs loaded forever.
8. **Member detail route stub** — `/members/:handle` did not load that member.

## Historical WIP captured at checkout

These files were uncommitted when this note was written. They were subsequently completed, reviewed, committed, and shipped.

Major WIP pieces:

- `supabase/migrations/005_security_hardening.sql`
  - URL constraints for profile links.
  - `public.public_profiles` view.
  - role-change trigger/policies/column grants.
  - `redeem_invite_for_email(...)` RPC for atomic invite reservation + cooldown.
  - `register_for_event(...)` RPC for event status/window/capacity checks.
  - filtered aggregate views.
  - revokes old `braga-whatsapp` seed invite.
- `supabase/functions/request-invite-magic-link/index.ts`
  - switched to `redeem_invite_for_email` before sending magic link.
- Frontend/client WIP:
  - removed hardcoded `/join/braga-whatsapp` links in touched files.
  - added separate count queries for ideas/events.
  - added upvote hydration and duplicate-insert tolerance.
  - added idea/event not-found states.
  - started safe public-profile view usage and safe external links.
  - added shared slug helper.
  - added `MemberProfile.tsx`; page wiring was still unfinished at this checkout and was completed before release.

## Resolution

All nine incomplete items from this checkout are resolved:

1. Private-invite navigation and member-detail routing are wired, including `MemberProfile` loading through `public_profiles` and real 404 states.
2. Supabase auth redirects use the exact Braga production host; the broad Vercel wildcard is absent.
3. `supabase/seed.sql` uses a deliberately local-only invite and no longer seeds `braga-whatsapp`.
4. Security contract tests cover role mutation boundaries, safe public profiles, guarded event registration, retry-safe invite delivery, and removal of the retired shared invite.
5. `bun run verify` passes with the current codebase.
6. Production exposes `public_profiles` while blocking anonymous reads of `profiles.role` and attendee-count data, confirming the relevant hardening is active.
7. The production invite Edge Function responds successfully to an allowed CORS preflight.
8. GitHub and Vercel production now deploy from the Braga downstream repository.
9. Fresh public smoke checks return `200` for `/`, the configured coded invite route, and `/signin`; `/join` and invalid member/post/event routes return `404`.

Fresh verification was completed on 2026-07-13. No security implementation work remains from this handoff.

## Procedure reminder

Use maintainer-approved deployment authentication only. Do not place browser sessions or deployment credentials in repository documentation.
