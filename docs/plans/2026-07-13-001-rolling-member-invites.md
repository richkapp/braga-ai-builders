# Rolling member invitations

## Goal

Replace public account creation with referral URLs that match how WhatsApp-, Facebook-, and chat-based communities actually grow.

## Product rules

### Member Settings

- Every active non-anonymous member, including admins, has a rolling pool of five unique single-use invitation URLs.
- Sharing is URL-first through Copy and the browser's native Share sheet. The product does not email invitations on the member's behalf.
- Opening a URL does not consume it.
- Requesting an authentication email places that URL in a temporary pending state.
- Only a newly confirmed member account consumes the URL.
- Existing members signing in through an invitation never consume it.
- Every consumed member URL is replaced atomically with one fresh URL, keeping the member's pool at five unconsumed URLs.
- Example: three URLs become pending, two recipients confirm accounts, and two replacement URLs appear immediately. The inviter then has four available URLs and one pending URL.
- Suspended members cannot create, view, or use member-generated invitations.

### Admin Settings and panel

- Admins receive the same personal rolling pool in Settings.
- The admin panel retains a separate invitation-campaign manager.
- An admin campaign has one URL with a required capacity from 1 to 50, a label, an optional custom slug, and optional expiry.
- Admins can inspect usage, copy/share, and revoke campaign links.
- Admins can inspect current member-owned links and replace a leaked or invalid link without reducing that member's five-link pool.
- Database constraints and RPC authorization enforce the 1–50 range; the browser is not the security boundary.

### Authentication boundary

- `/signin` signs in existing members only and cannot create accounts.
- New accounts require an active member or admin invitation URL.
- Passwordless email remains the authentication mechanism after the recipient opens a shared invitation URL.
- Anonymous posting remains available, but its account-upgrade prompt signs in existing members rather than creating uninvited accounts.
- The retired public reusable community-access code is not an account-creation path.

## Technical approach

1. Add a forward-only Supabase migration that classifies invitation rows, constrains member/admin limits, removes direct authenticated mutation grants, and adds security-definer RPCs.
2. Generate member URLs only inside an RPC with an advisory transaction lock and cryptographically random codes.
3. Reserve and arm pending capacity before GoTrue can confirm a user, release definitively failed requests, and consume capacity only after Supabase confirms a new member.
4. Replenish the inviter's pool in the same database transaction that consumes a member invitation.
5. Add an authenticated read RPC returning the five current member URLs plus recent used URLs and their statuses.
6. Update the Edge Function to distinguish invited account creation from existing-member sign-in and to stop incrementing capacity after email delivery.
7. Add a Settings React island for the personal pool and update the admin manager to use constrained RPCs.

## Non-goals

- Sending invitation emails from Braga.
- Contact imports or address books.
- Public signup without an invitation.
- Applying migrations or deploying Supabase/Vercel production without explicit approval.

## Verification

- Contract tests assert the source-level pool, authorization, single-use, confirmation, and admin-limit boundaries. Executable RPC/trigger behavior must also be exercised against an approved PostgreSQL/Supabase target before production merge.
- `bun run verify` passes.
- The branch receives GitHub Verify and Vercel preview checks.
- Before production merge: apply the reviewed migration, deploy the updated Edge Function, smoke the RPCs, then merge and verify the production site.
