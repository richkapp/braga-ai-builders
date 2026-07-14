# Architecture

Braga AI Builders uses a server-rendered Astro app with React islands for interactive and authenticated UI. Supabase Cloud owns Auth, Postgres, Row Level Security, and privileged Edge Functions. Vercel is the supported frontend host for v0.1.x.

## Data model

- `profiles`: member profile data keyed to `auth.users`; public reads are opt-in and field-limited, while role and suspension state remain private. Native avatars use one opaque `avatar_path` per profile and a public, size-limited Supabase Storage bucket.
- `invites`: system bootstrap links, rolling member-owned single-use URLs, and 1–50-use admin campaign URLs.
- `invite_redemptions`: private delivery, pending-confirmation, capacity, and confirmed-member audit records.
- `ideas`: public posts; stable anonymous visitor identifiers are never granted through the public Data API.
- `post_tags`: private shared tag registry seeded with the original tags. Public-safe catalog and active-member creation use narrow RPCs; categories remain fixed on `ideas`.
- `idea_votes`: one upvote per authenticated or Edge-Function-managed visitor identity.
- `idea_bookmarks`: private, unique member-to-post bookmarks with cascading cleanup when either account or post is deleted; clients use constrained RPCs rather than direct table access.
- `events`: organizer-managed public listings that link to external RSVP pages.
- `event_registrations`: inactive legacy storage retained for migration compatibility; it is not part of the v0.1.x user interface and aggregate counts are private.
- `bug_reports`: private visitor-submitted reports with organizer triage; the public form writes only through a rate-limited Edge Function, while a database trigger queues optional Resend notifications through `pg_net` using Vault-held secrets.

## Authentication

Existing members use `/signin`, which requests a Supabase magic link with account creation disabled. New members enter through a generated `/join/:code` URL. The browser submits the invite code and email to `request-invite-magic-link` only after explicit transactional-email consent. Password authentication is not used.

A delivery attempt arms a temporary pending reservation before GoTrue can confirm the Auth user; provider failure releases it. Supabase confirmation claims the invite for the newly confirmed account, increments capacity, and atomically replenishes a member-owned link. Existing members using an invitation to sign in never consume it.

Every active member, including admins, gets five current single-use URLs through a security-definer RPC. Admins additionally create labeled campaign links with capacities from 1 to 50. Direct authenticated invite-table mutations are revoked.

`admin` and `super_admin` are separate authorization levels. Both can use organizer tools. Only a non-suspended super admin can assign ordinary admins, suspend or restore member access, or delete an Auth user and its cascading community data.

## Public data boundary

Public pages may read published events, non-hidden posts, aggregate upvote counts, the public-safe popularity-ranked tag catalog, and opted-in profile fields. The Data API excludes private emails, invite data, bookmark rows, tag-creator IDs, stable anonymous visitor IDs, attendee counts, and admin-only member fields. RLS and explicit grants both enforce these boundaries.

Avatar object URLs contain random UUID paths rather than Auth user IDs. Only opted-in public profile and post-author views expose those paths; legacy external avatar URLs remain read-only until members replace or remove them.
