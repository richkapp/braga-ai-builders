# Native profile avatars

**Date:** 2026-07-14

## Outcome

Active members can upload, replace, or remove a profile photo without hosting it elsewhere. Existing external avatar URLs remain readable as a legacy fallback but are no longer editable.

## Product rules

- Accept JPEG, PNG, and WebP source images up to 2 MB.
- Center-crop and resize in the browser to a 384 × 384 WebP before upload.
- Keep the compressed upload at or below 256 KB; the Storage bucket rejects anything above 512 KB.
- Keep one stable, opaque avatar object per member. Replacements overwrite it; removal deletes it.
- Show initials when there is no usable avatar or an image fails to load.
- Avatar changes persist immediately and do not wait for the rest of the profile form to be saved.
- Uploaded avatars are public assets only surfaced through profiles that are already public.
- Anonymous, suspended, signed-out, and cross-account callers cannot reserve, upload, replace, confirm, or remove another member’s avatar.
- Account changes hide the previous profile immediately and suppress stale avatar UI responses.

## Implementation

1. Add a forward-only migration that creates the public `avatars` bucket, adds an opaque `avatar_path`, updates public-safe views, and adds owner-bound reserve/confirm/clear RPCs plus Storage RLS.
2. Add browser image validation, center-cropping, WebP compression, upload/removal operations, and cache-busted public URL resolution.
3. Replace the avatar URL field with an uploader matching the existing Braga form language and states.
4. Resolve uploaded avatars everywhere profiles appear: directory cards, member pages, post-author previews, and organizer member cards.
5. Add migration/security contracts, image helper tests, profile race coverage, and browser upload/replace/remove QA.
6. Apply migration 028 through the approved production path, verify bucket/policies/RPCs, run temporary authenticated smoke checks with cleanup, then merge and verify production.

## Visual thesis

Extend the existing dark Braga card system with one compact identity row: a large square avatar, direct Replace/Remove actions, and plain status copy. No new visual system and no decorative upload dropzone.

## Verification

- `bun run verify`
- migration parser and hash check
- staged Gitleaks and focused security review
- local authenticated browser QA for valid upload, replacement, removal, invalid type, oversize input, and account-switch safety
- desktop and 390 px mobile route QA with zero unexpected console errors and no overflow
- production bucket/policy/RPC readback, authorization smoke tests, cleanup proof, GitHub Verify, Vercel, and live route QA
