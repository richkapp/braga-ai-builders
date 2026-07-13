# Settings and post library

**Date:** 2026-07-13

## Outcome

Members can move between Profile, Invites, My posts, and My bookmarks without scrolling through unrelated Settings sections. Signed-in members can also filter the public Posts feed to their own posts or saved posts, edit their own open posts, and bookmark visible posts.

## Product rules

- Replace the unexplained invitation status **Pending** with **Claim in progress** and explain that the link is reserved for up to 24 hours after an authentication email is requested.
- A plain invitation-page visit does not reserve a link.
- Settings uses pill tabs for **Profile**, **Invites**, **My posts**, and **My bookmarks**. Only the selected panel renders.
- The Posts page exposes **All posts**, **My posts**, and **My bookmarks** pills to signed-in members.
- Existing author-only editing remains available on owned open posts in every post-list surface.
- Bookmarks require a signed-in, active, non-anonymous member account and persist across devices.
- Bookmarking is idempotent, private to the member, and never exposes account identifiers through public post reads.
- Hidden/deleted posts do not appear in My bookmarks. Deleting a post or member removes related bookmark rows.
- Suspended members retain public read access but cannot add or remove bookmarks.

## Implementation

1. Add failing frontend and security contracts for tab navigation, claim wording, own-post filtering, bookmark controls, private bookmark storage, authorization, uniqueness, and cascade behavior.
2. Add a forward-only Supabase migration with a private `idea_bookmarks` table and constrained RPCs for relationship lookup and idempotent desired-state bookmark updates.
3. Add a Settings React hub that owns tab state and renders the existing profile/invite components or a scoped post feed.
4. Extend the post feed with signed-in library pills, owned-post filtering, bookmark filtering, bookmark controls, and existing edit capability.
5. Add bookmark parity to post detail pages.
6. Verify, review, ship through a PR, apply the reviewed migration before frontend merge, then verify production without creating test accounts or sending email.

## Verification

- Settings changes panels without page scrolling and supports a direct `?tab=` URL.
- Signed-out visitors can browse all posts but cannot mutate bookmarks.
- Signed-in members see their own posts and bookmark history on Settings and Posts.
- Bookmark toggles are private, unique, and reversible.
- Existing owned open posts retain Edit controls; other members cannot edit them.
- Invitation UI explains exactly when the 24-hour claim reservation begins.
- Full project verification, migration parse, diff checks, secret scan, CI, Vercel preview, production migration verification, and live route/asset checks pass.
