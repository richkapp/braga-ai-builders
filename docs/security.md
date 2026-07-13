# Security

## Rules

- No passwords in v0.1.x.
- Existing-member sign-in cannot create accounts. New accounts require generated member or admin `/join/:code` URLs.
- Transactional login/signup email requires explicit consent and must never be reused for marketing.
- No service-role key in client code.
- No private email, member auth UUID, or stable anonymous-visitor identifier in public API responses.
- Profiles are private by default and public only after member opt-in.
- No downvotes.

## RLS and API expectations

- Active members are permanent, non-anonymous accounts that can update only their own profile and posts; suspended accounts and temporary anonymous identities are blocked from direct community mutations at the database boundary.
- Visitors can create anonymous posts and upvotes only through the origin-checked Edge Function.
- Public post reads expose only a safe per-viewer edit capability; underlying author and anonymous visitor IDs remain private.
- Member bookmarks are private account state exposed only through narrow relationship and idempotent desired-state RPCs; clients have no direct bookmark-table privileges.
- Events are public listings that send RSVP traffic to external event pages.
- Legacy event-registration tables and functions are not part of the user-facing product and attendee counts are not public.
- Members can read only their own five-link invitation pool through a constrained RPC. Organizers can inspect and replace current member-owned links, create campaign invites, manage events, moderate post lifecycle state, triage bug reports, and read the full member directory.
- Bug-report notifications are queued from the database insert boundary through `pg_net`; Resend credentials stay in Supabase Vault, and notification failure does not roll back the report.
- Only super admins can assign or remove admin access, suspend or restore members, and permanently delete member accounts. The RPC boundary blocks self-management and changes to another super-admin account.
- Visitors can read only published or explicitly public data.

## Invite abuse controls

Member invitations are cryptographically random and single-use. Every active member has five unconsumed URLs; confirmation consumes one and replenishes one inside the same locked database transaction. Delivery creates a temporary pending reservation, while clicks, failed delivery, and existing-member sign-in do not consume capacity. Suspended inviters' links stop working.

Admin campaign invites support custom codes, expiration, revocation, and a database-enforced capacity from 1 to 50. Reservation capacity is checked before transactional email delivery, and the Edge Function rate-limits repeated email and IP requests.
