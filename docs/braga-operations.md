# Braga downstream operations

This repository owns the live Braga AI Builders application. It shares history with Local Community Platform through the `braga-split-2026-07-12` tag, then evolves as a reviewed downstream.

## Repository remotes

A Braga checkout should have:

```text
origin    git@github.com:richkapp/braga-ai-builders.git
upstream  git@github.com:richkapp/local-community-platform.git
```

Configure a new checkout with:

```bash
git clone git@github.com:richkapp/braga-ai-builders.git
cd braga-ai-builders
git remote add upstream git@github.com:richkapp/local-community-platform.git
git remote -v
```

`origin/main` is protected and deploys Braga. `upstream/main` is the canonical platform. Never push upstream changes directly to Braga `main`; use the sync pull-request workflow in [Upstream and Braga downstream](upstream-downstream.md).

## Braga-owned configuration

- `src/config/community.ts` contains Braga identity, landing-page content, chat URL, and invite route.
- Its `githubUrl` intentionally points to Local Community Platform because the footer credits the canonical open-source platform.
- Braga's Supabase project, Vercel project, environment variables, Vault values, email-provider configuration, and member data are downstream infrastructure. None belong in Git.
- Optional platform features are enabled or disabled for Braga deliberately. An upstream merge must not silently opt Braga into a new external service.

## Shipping Braga changes

1. Branch from Braga `main`.
2. Implement the Braga-specific change.
3. Add tests and migration/deployment notes where applicable.
4. Run `bun run verify`.
5. Push the branch and open a pull request against Braga `main`.
6. Wait for required GitHub and Vercel preview checks.
7. Merge, verify the production deployment, and separately apply any reviewed Supabase or provider changes.

A merged Git commit does not apply database migrations, rotate secrets, or prove production behavior.

## Promoting a Braga feature upstream

Do not open an upstream pull request from Braga `main`. Start from the canonical platform instead:

```bash
git fetch upstream
git checkout -b feat/FEATURE-NAME upstream/main
```

Port only the reusable work. Remove Braga copy and policy, make optional behavior configurable with safe defaults, add generic documentation and tests, and open the pull request against `richkapp/local-community-platform:main`.

After the canonical implementation merges, sync upstream back into Braga. This keeps one reusable implementation instead of maintaining parallel copies.

## Production boundary

The Braga Vercel project must remain connected to `richkapp/braga-ai-builders` with `main` as its production branch. Local Community Platform releases do not change the live Braga site until Braga merges a sync pull request.
