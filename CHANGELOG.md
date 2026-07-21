# Changelog

## Unreleased

Performance:

- Pre-rendered fixed public and account-shell routes for Vercel CDN delivery while keeping parameterized data routes on demand in Paris beside the Supabase project.
- Added Astro client navigation, intent-based link prefetching, and a persistent header/footer shell so route changes no longer reload the document and global islands.
- Consolidated browser authentication and Voting visibility into one shared session store, skipped signed-out event-admin checks, and lazy-loaded the bug-report dialog only when opened.
- Replaced the Posts author/count/bookmark/vote waterfall with one privacy-safe feed RPC and shared one tag-catalog request across feed, composer, and editor controls.
- Corrected the aggregated feed to preserve anonymous upvotes, kept Astro router history intact through Dashboard and restored-post URL changes, and closed persisted menus/dialogs before route transitions.

Posts:

- Clarified the logged-out post composer: membership is invite-only, with invitations available through the WhatsApp community or an existing member.
- Renamed the public post route from `/ideas` to `/posts`, with permanent compatibility redirects for existing links and post detail URLs.
- Moved post creation into an accessible modal launched from the left sidebar, and moved post library, category, and tag filters into that sidebar.
- Reworked feed cards around the poster's avatar, name, and publication date, with clearly distinct member and anonymous fallback artwork.
- Tightened post-card hierarchy so compact author metadata and tags sit above and below the more prominent title at the same supporting text size.
- Added an avatar-only Member filter ranked by post count, with hover names, six-member collapse, and an expandable full author list.
- Added detail-only threaded comments with replies to replies, member or anonymous attribution for signed-in members, comment upvotes, and feed-level comment counts.
- Reworked post-detail discussion into a minimal Reddit-style thread: a collapsed **Leave a Comment** control, compact inline composer, nested reply rails, and only upvote/reply actions.
- Moved **Post anonymously** into the initial post form, defaulted it off for signed-in members, and locked it on with account guidance for signed-out visitors.
- Added super-admin database-backed switches for anonymous posts, signed-out posts, anonymous comments, and anonymous replies.
- Preserved replies when an author or parent comment is removed, made feed comment counts fail soft, and restored reliable `#comments` navigation after async detail loading.
- Hardened participation after review: attribution now stays correct through auth transitions, `#comments` scrolls only once, deep mobile threads retain readable width, cancelled composers restore keyboard focus, suspended super admins cannot race a setting change, and deleted members remain distinct from anonymous posters.
- Added native post sharing with clipboard fallback beside the feed comment count and the detail-page bookmark action.
- Corrected post sharing to send only the canonical post link, without appending the post title or community name.
- Renamed the signed-in Settings navigation label and page heading to Dashboard.
- Kept post creation available through feed refreshes and read failures, and prevented magic-link requests from racing backward navigation in the composer.
- Added a simple **Back to posts** action above every post detail and persisted the active library, category, tag, and member filters in the Posts URL and current browser tab.

Community voting:

- Added an organizer-controlled on/off switch that hides Voting from public navigation, blocks public results and ballots at the database boundary, and restricts the page to organizers while disabled.
- Added an organizer-only **Create a new poll** action to the public Voting page.

- Added a public Voting tab with live counts, percentages, turnout, publicly named ballots, and a closed-vote archive.
- Let active signed-in members cast one choice, change it until closure, and opt into anonymous display without weakening one-member-one-ballot enforcement.
- Added organizer-only draft, preview, publish, pre-ballot edit, early-close, and safe-delete controls for votes with 2–10 ordered options and required deadlines.
- Kept voting tables private behind narrow RPCs that serialize edits, closure, and ballot changes while preventing anonymous voter identities from reaching application surfaces.
- Hardened deadlines against lock-wait races with wall-clock checks, and latched the first accepted ballot so vote content and options stay permanent even if ballot attribution is later removed.

Branding:

- Gated every public WhatsApp invitation behind the Braga Area WhatsApp Community rules, local-residency confirmation, and explicit Terms and Privacy consent before opening the group invite.
- Added route-aware Open Graph and Twitter preview cards over Braga hero photography for the homepage, invitation links, post and event details, and member profiles.
- Resolved real post, event, and member titles and descriptions in server-rendered metadata, and prevented production builds from emitting localhost canonical or image URLs.
- Added content-derived revision keys so edited posts, events, and member profiles receive fresh share cards under immutable CDN caching.
- Made **See Posts** the landing-page hero's primary action and moved **Join the WhatsApp Community** to the secondary position.
- Replaced the illegible circular navigation badge with the supplied colorful brain-and-network artwork on a transparent background.
- Rebuilt the browser favicon as a brain-only circuit mark with separate light- and dark-browser variants.

Authentication:

- Moved Braga's production Auth email from Brevo's rewritten sender to direct Gmail SMTP after enabling 2-Step Verification and creating an App Password; a controlled magic-link request returned HTTP 200 and arrived from the expected Gmail sender.
- Replaced the misleading existing-member delivery confirmation with an enumeration-safe **Request received** state, while preserving Supabase Auth error codes for diagnostics and returning truthful retry errors on private-invite delivery failures.
- Kept accepted invite emails successful when post-send bookkeeping needs reconciliation, and separated post-composer resend failures from the prior successful request state.
- Reframed private invite links as a welcoming introduction to Braga AI Builders, with a short community description and one clear instruction to create an account—or sign in—using a magic link.
- Added a Supabase-aligned 60-second resend countdown after successful magic-link requests, followed by an in-place **Send magic link again** action across member access, private-invite signup, and post-composer sign-in.
- Consolidated email-link consent and the Terms/Privacy links into one explicit checkbox sentence across member access and post-composer sign-in.
- Added polished, keyboard-accessible **Sign In** and **Sign Up** tabs to `/signin`; existing members keep the email-link form while new members see the WhatsApp and friend-invite routes without opening a misleading public signup form.
- Simplified the Sign In panel's new-member prompt to **New here? Sign Up →**, switching and focusing the accessible Sign Up tab instead of duplicating its invitation details.
- Replaced magic-link jargon with the same three-step **Enter email → Open email → Tap the link** explanation across sign-in, private-invite signup, and post-composer access, while shortening consent, legal, success, and retry copy.

Privacy and support:

- Added GDPR-aware Privacy Policy and Terms and Conditions pages grounded in the site's actual Supabase, Vercel, browser-storage, anonymous-participation, invitation, and support-report data flows.
- Reworked the global footer into navigation and legal/support rows, with Terms, Privacy, and Report a Bug grouped beneath the primary community links.

Profile settings:

- Accepted iPhone HEIC and HEIF profile photos, lazily converted unsupported sources in the browser, then kept the existing square 384 px WebP compression and upload limits.
- Replaced editable external avatar URLs with native profile-photo uploads that validate JPEG/PNG/WebP/HEIC/HEIF sources up to 10 MB and 25 megapixels, center-crop them to 384 px WebP, and keep compressed objects under 256 KB.
- Generate previews from the compressed 384 px image instead of decoding the large source a second time on memory-constrained mobile browsers.
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
