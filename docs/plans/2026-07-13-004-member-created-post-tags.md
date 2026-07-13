# Member-created post tags

## Goal

Let active members create up to three reusable post tags over the lifetime of their account, while keeping categories fixed and keeping composer/filter tag lists compact.

## Product contract

- Categories remain `Idea`, `Resource`, and `Perspective`; members create tags only.
- Every active, non-anonymous member may create at most three custom tags. Created tags are shared globally and cannot be renamed or deleted, so deleting one never restores quota.
- Tag labels are unique case-insensitively, 2–28 characters, and normalized to stable slugs.
- Every post may use at most six distinct registered tags.
- The composer shows the six most-used tags first. A chevron reveals the full popularity-ranked catalog and, for active members, a final `ADD A TAG X/3` control plus an information disclosure explaining the rules.
- The public feed keeps all three category filters and shows the six most-used tags first. The chevron reveals the rest. Tag filters are multi-select and combine with the category filter.
- Anonymous posters may use any registered tag but cannot create tags.

## Visual thesis

Extend the existing lime/violet pill language with a compact ranked tag strip, one quiet disclosure control, and an inline creation state—no new visual system.

## Content and interaction

1. Category pills remain first.
2. Tag pills show popularity-ranked suggestions, selected-count feedback, and a rotating chevron disclosure.
3. Expanded composer catalog ends with quota, info, and inline create controls.
4. Feed filters use category plus zero or more active tag pills; selected tags use AND matching.

## Security and data design

- Forward migration `026_member_created_post_tags.sql` creates a private tag registry seeded with the six existing tags.
- Narrow security-definer RPCs list the public-safe catalog and create a tag for an active member.
- Creation uses a per-member advisory transaction lock and counts historical custom-tag rows before inserting, preventing concurrent quota overruns.
- The ideas tag allowlist check becomes a security-definer validation trigger backed by the registry.
- Direct member writes and the anonymous Edge Function path both hit the same registry validation.
- No direct Data API table access is granted.

## Verification

- Static frontend/security contracts for quota, grants, dynamic validation, popularity order, six-tag collapsed limits, disclosure controls, and multi-tag filtering.
- `bun run verify`, migration parsing, diff checks, and Gitleaks.
- Desktop/mobile screenshots for collapsed, expanded, info, and add-tag states.
- Production smoke tests create tags concurrently, prove the lifetime cap, use a custom tag on a post, verify public filtering/catalog behavior, and remove only temporary post/account data. Custom tags used for verification remain lifetime registry rows only if created on a real member; otherwise test in rollback-only transactions.
