# AGENTS.md — Braga AI Builders downstream

## Project

This repository is the Braga-specific downstream deployment of [`richkapp/local-community-platform`](https://github.com/richkapp/local-community-platform). Its protected `main` branch is the source for the live Braga AI Builders Vercel deployment.

Braga-specific features and experiments belong here. Reusable community-platform features should be generalized and proposed to the canonical upstream, then synced back through a reviewed downstream pull request. Do not merge this repository's entire `main` branch upstream.

Core scope:

- rolling member invitation URLs, constrained admin invitation campaigns, and passwordless email magic-link authentication;
- member profiles, settings, and a public-safe member directory;
- public posts with upvote-only voting, categories, and tags;
- external community event pages;
- organizer tools for invites, events, post moderation, and admin-only member access.

## Workspace

- Use Bun. Do not use npm, Yarn, or pnpm unless a tool specifically requires `npx` for a one-off CLI.
- Before work, read this file, `CHANGELOG.md`, and relevant current documentation.
- Preserve dirty worktrees and inspect Git status before changing files.

## Architecture

- Astro provides layouts and server routes; React islands handle interactive/authenticated UI.
- Supabase provides Auth, Postgres, Row Level Security, and Edge Functions.
- Vercel is the supported frontend host for v0.1.x. Other adapters require an explicit configuration change.
- `src/config/community.ts` is the single source for public community identity, theme language, and links.
- `supabase/migrations/` is the source of truth for schema, grants, RLS, views, and RPCs.
- `origin` is the Braga downstream repository; `upstream` is Local Community Platform.
- This is a separate shared-history repository, not a GitHub network fork. GitHub does not support creating a differently named fork under the same owner.
- The Braga Vercel project must stay connected to this downstream repository. When the Vercel GitHub App uses selected-repository access, grant access to this repository before changing the connection.
- Every installation owns separate provider accounts, projects, credentials, and member data.

## Product and security rules

- Keep profiles private by default and separate public profile fields from private account data.
- Do not add password authentication; use the configured community-access magic-link flow.
- Require explicit consent before sending a transactional login/signup email.
- Do not use member emails for marketing.
- Keep post voting upvote-only.
- Keep event creation, moderation, and full member access organizer-only.
- Use service-role keys only inside trusted Edge Functions or maintainer operations.
- Every Supabase client operation in React needs loading and safe error states.
- Add static or executable checks for new authorization boundaries.
- Never commit production credentials, auth links, sessions, member exports, or `.env` files.

## Commands

```bash
bun install
bun run dev
bun test
bun run build
bun run verify
```

## Delivery

- Use feature branches and pull requests; do not push application work directly to `main`.
- Sync upstream on a `sync/upstream-*` branch, preserve intentional Braga configuration, run verification, and merge through a pull request.
- When promoting a Braga-born feature upstream, create a focused branch from upstream `main`, remove Braga assumptions, add generic configuration and safe defaults, and document the reusable community problem.
- Treat optional external services as disabled until each installation supplies its own configuration.
- `bun run verify` is the required merge gate.
- Keep contributor and self-hosting docs aligned with environment, schema, or deployment changes.
- A Git sync does not apply Supabase migrations, Vault values, or provider configuration; review and execute those separately.
- After repository or deployment-source changes, prove the connection with a downstream pull request, a successful Vercel preview, a successful production deployment from downstream `main`, and an HTTP check of the public site.
- Verify deployed routes and authorization boundaries before reporting a release complete.
- Production email tests require explicit approval and a controlled deliverable inbox; never use disposable or non-deliverable addresses.
