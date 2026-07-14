# Changelog

## Unreleased

Community voting:

- Added a public Voting tab with live counts, percentages, turnout, publicly named ballots, and a closed-vote archive.
- Let active signed-in members cast one choice, change it until closure, and opt into anonymous display without weakening one-member-one-ballot enforcement.
- Added organizer-only draft, preview, publish, pre-ballot edit, early-close, and safe-delete controls for votes with 2–10 ordered options and required deadlines.
- Kept voting tables private behind narrow RPCs that serialize edits, closure, and ballot changes while preventing anonymous voter identities from reaching application surfaces.
- Hardened deadlines against lock-wait races with wall-clock checks, and latched the first accepted ballot so vote content and options stay permanent even if ballot attribution is later removed.

Branding:

- Replaced the illegible circular navigation badge with the supplied colorful brain-and-network artwork on a transparent background.
- Rebuilt the browser favicon as a brain-only circuit mark with separate light- and dark-browser variants.

Profile settings:

- Replaced editable external avatar URLs with native profile-photo uploads that validate 2 MB JPEG/PNG/WebP sources, center-crop them to 384 px WebP, and keep compressed objects under 256 KB.
- Added immediate photo preview, replacement, removal, broken-image fallbacks, and cache-busted avatar rendering across member, post-author, and organizer surfaces.
- Bound one opaque Storage object to each active member through narrow RPCs and Storage RLS, without exposing Auth user IDs in public asset paths.
- Member deletion now removes the avatar through Storage first, while the database RPC refuses account deletion if a public avatar object remains.
- Kept unsaved profile edits intact when Supabase refreshes the same member's authentication session after switching browser tabs.
- Bound profile loads and saves to the account that initiated them so delayed responses or account switches cannot overwrite another member's profile state.

Member-created post tags:

- Added a shared tag catalog ranked by usage, with six-tag collapsed views and expandable catalogs in the post composer and feed filters.
- Let active members create up to three tags over the lifetime of their account, with duplicate protection, clear naming rules, and no delete-or-reset path.
- Added category-plus-multiple-tag filtering while keeping categories fixed as Idea, Resource, and Perspective.
- Replaced the fixed post-tag database allowlist with a private registry and narrow RPCs that validate both member and anonymous post writes.
- Serialized tag creation with account suspension, normalized any legacy duplicate tag arrays, and kept the fixed system tags available if the catalog RPC is temporarily unavailable.
- Exposed selected state and filtering intent on clickable post badges, and stopped desktop-only author previews from widening the mobile feed.

Member post library:

- Reworked Settings into Profile, Invites, My posts, and My bookmarks pill tabs so members can reach each section without scrolling through unrelated forms.
- Added My posts and My bookmarks views to the public Posts page while preserving author-only editing for owned open posts.
- Added private, account-synced post bookmarks with bookmark controls on feed and detail views.
- Kept simultaneous bookmarks on popular posts concurrent and indexed member post-history lookups by author.
- Renamed the ambiguous invitation Pending state to Claim in progress and explained that the 24-hour reservation starts only after an authentication email is requested.

Rolling member invitations:

- Replaced the public reusable account-creation route with private URLs shared directly through WhatsApp, Facebook, Signal, or any other channel, and revoked legacy reusable codes during migration.
- Added a rolling pool of five unique single-use links to every active member's Settings; each confirmed new member atomically triggers one replacement link.
- Added available, pending, and recently used states with copy, native share, refresh, and automatic polling.
- Kept admins on the same personal five-link pool while adding separate admin campaign links with database-enforced capacities from 1 to 50, optional custom slugs, expiry, usage reporting, and revocation; admins can also inspect and replace leaked member-owned links.
- Separated existing-member sign-in from invited account creation and stopped anonymous Posts from creating uninvited accounts.
- Changed invite capacity so clicks and email delivery do not consume a link; only a newly confirmed member account does.

Repository and deployment separation:

- Established `richkapp/braga-ai-builders` as the protected Braga-specific downstream while preserving shared Git history with Local Community Platform.
- Kept `richkapp/local-community-platform` as the canonical upstream and documented how Braga experiments are generalized, proposed upstream, and synced back through reviewed pull requests.
- Reconnected the existing Braga Vercel project to downstream `main` and verified both preview and production deployments from the new source repository.
- Added only the downstream repository to the Vercel GitHub App's selected-repository access; no production credentials or Supabase data moved into GitHub.

## 0.1.2 — 2026-07-11

Theme-neutral repository identity and configuration:

- Renamed the open-source project from Braga AI Builders to Local Community Platform while preserving Braga AI Builders as the reference deployment.
- Repositioned the project for any local or interest-based community, not only AI groups.
- Moved Braga's AI-specific landing-page language into `src/config/community.ts` so forks can replace the theme without rewriting page components.
- Updated the package name, repository links, self-hosting examples, metadata, and generic profile fallbacks.
- Closed the historical security-review handoff after verifying its route, database-permission, invite-delivery, CI, and production-deployment work is shipped; no application code or runtime configuration changed.

## 0.1.1 — 2026-07-11

Release-audit hardening for the first public template:

- Removed stable anonymous visitor identifiers and member auth UUIDs from public post reads.
- Made external-event attendee counts private.
- Fixed invite-capacity checks so exhausted retries fail before email delivery.
- Aligned authentication, external-RSVP, and historical-audit documentation with the live product.
- Added the missing idea-account invite environment variable to the setup template.
- Pinned Bun and direct dependencies and documented frozen-lockfile installs.
- Made the canonical site URL configurable through `PUBLIC_SITE_URL`.

## 0.1.0 — 2026-07-11

First stable open-source release of the platform running Braga AI Builders.

### Community experience

- Reframed the landing page around a broad spectrum of AI curiosity and practical use.
- Added clear WhatsApp and post-browsing paths, community memory, community-shaped events, and member attribution explanations.
- Simplified public language from internal idea/RIP terminology to posts.
- Added post categories, tags, filtering, anonymous posting, anonymous upvoting, author editing, and organizer moderation.
- Added clickable post authors with accessible hover cards and public social links.
- Added public external events with organizer import/edit controls and external RSVP links.
- Added profile social icons, X links, private-by-default visibility, and a prominent directory opt-in.
- Added explicit passwordless sign-in language and a required Supabase magic-link consent checkbox with a no-marketing promise.
- Added an open-source GitHub link in the footer.

### Organizer and security

- Added an admin-only member database that includes private profiles without exposing them publicly.
- Hardened profile role updates, invite redemption, event registration, post lifecycle changes, API grants, CORS, URL fields, and public author/profile views.
- Removed event-registration management from the organizer interface.
- Added safe not-found states and public-route server checks.
- Added GitHub verification workflow plus frontend and security contract coverage.

### Open source

- Centralized public community identity in `src/config/community.ts`.
- Added self-hosting, deployment, contribution, and security documentation.
- Kept production secrets and member data outside the repository.
- Prepared the repository for GitHub template use under the MIT license.

## 2026-07-09

- Created the initial Astro, React, Tailwind, Supabase, and Vercel application.
- Added the initial schema, RLS policies, invite function, profiles, posts, events, and organizer surfaces.
- Created the public GitHub repository and reference deployment.
