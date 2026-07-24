---
date: 2026-07-24
topic: create-community-launcher
---

# Create Your Community Launcher Requirements

## Summary

Add a free public `/create` flow that turns an organizer's plain-English answers into a tailored launch brief for a capable AI agent. The agent fetches a stable Local Community Platform release, configures the organizer's independent installation, guides provider setup, and finishes only after the public homepage, organizer login, and a real member invitation work.

---

## Problem Frame

A local community may use chat groups, social networks, event tools, documents, and a basic website without having one durable home it controls. People, knowledge, events, and decisions become fragmented or disappear in fast-moving chats and feeds.

The Local Community Platform already provides the durable environment, but its self-hosting path expects an organizer to understand source repositories, Supabase, Vercel, transactional email, migrations, environment values, Edge Functions, and bootstrap administration. That is a deployment manual, not a viable first-run experience for a non-technical organizer.

The launcher must make the existing software approachable without pretending AI can remove provider accounts, security boundaries, legal review, or real launch verification.

---

## Product Promise

**Give your local community a proper home: a permanent, community-owned place where its people, knowledge, events, and decisions stay organized and findable instead of disappearing across chats and feeds.**

The platform may complement WhatsApp, Discord, Facebook, Signal, email, or other channels. No external channel defines the product.

---

## Key Decisions

- **Dedicated public launcher.** The primary experience lives on `/create`, reached through a visible **Create your community** link rather than being buried in self-hosting documentation.
- **Free and public.** The first version requires no purchase, Braga membership, or platform account.
- **Agent-guided setup.** The launcher prepares the work; the organizer's AI agent performs it with the organizer. The launcher does not automate external accounts through stored credentials.
- **Capability over vendor.** Claude, Codex, Hermes, and other agents are supported only when they can access files and run commands. A browser chat alone is not sufficient.
- **One complete maintained platform.** Every built module is installed. Super admins change community-level availability and participation settings after deployment; onboarding does not create source variants or ask organizers to assemble the product.
- **Prompt handoff.** The launcher produces one tailored primary launch brief plus recovery context. It does not generate or deliver a personalized source archive.
- **Image supplied later.** The web flow does not upload the hero image. The AI asks the organizer for it when configuring the fetched source.
- **Stable source.** The launch brief points the agent to a stable upstream release, not a moving development branch or the Braga downstream repository.
- **Independent ownership.** Each organizer owns the source copy, provider accounts, deployment, credentials, and community data.
- **No one-click provisioning.** OAuth-based or centrally credentialed provider provisioning is outside the product. The AI guides the organizer through creating and configuring each owner-controlled account one action at a time.
- **Real completion gate.** A homepage alone is not a launch. The public homepage, organizer authentication, and a member invitation must work in production.
- **Braga first, upstream-ready.** Braga is the first proving ground, but the launcher language, behavior, and configuration model remain community-neutral so the feature can be promoted upstream without a product rewrite.

---

## Actors

- A1. **Community organizer:** Describes the community, follows guided provider steps, supplies the hero image, approves publication, and changes feature settings after deployment when needed.
- A2. **Capable AI agent:** Fetches the stable source, configures it, explains one action at a time, protects secrets, deploys the installation, and gathers launch evidence.
- A3. **Provider services:** Supply source hosting, database and authentication, transactional email, and public application hosting under organizer-owned accounts.
- A4. **First invited member:** Uses a real invitation and passwordless email flow to prove that new-member access works outside the organizer's session.

---

## Requirements

**Entry, positioning, and eligibility**

- R1. Every enabled installation may expose a visible **Create your community** link to the dedicated `/create` route.
- R2. The launcher presents the Product Promise before asking setup questions.
- R3. The flow is available without payment, membership, or account creation.
- R4. The flow explains that it installs ready-made open-source software rather than asking AI to build a platform from scratch.
- R5. Before intake begins, the organizer must confirm that their AI can access files and run commands.
- R6. An organizer using a chat-only AI receives a clear incompatibility explanation and cannot be led into a setup the tool cannot complete.
- R7. The launcher explains that independent provider accounts and production email delivery are required before the first invitation can work.

**Community intake**

- R8. The flow groups a small number of plain-language community questions per screen and explains unfamiliar tools only when they become relevant.
- R9. The intake captures the community's name, locality, purpose, intended members, organizer identity, and platform language. The AI infers country, time zone, and regional formatting and asks only when ambiguous.
- R10. The intake captures enough source material to draft a tagline, short description, homepage message, and community-specific labels without inventing factual claims.
- R11. The organizer reviews the generated community summary before the launch brief is created.
- R12. The launcher does not request the hero image; the tailored launch brief instructs the AI to request it later.
- R13. The launcher never asks for passwords, API keys, service-role keys, database passwords, SMTP credentials, access tokens, or private invitation links.
- R14. Intake answers are not sent to an external AI or stored as a server-side community record merely to generate the launch brief.

**Complete platform and super-admin settings**

- R15. Every launch installs the complete maintained platform: public homepage, invitation-based passwordless access, member accounts and directory, posts and discussions, events, voting, organizer controls, bug reporting, and configurable Terms and Privacy templates.
- R16. The launcher does not ask the organizer to choose product modules during onboarding.
- R17. The deployed platform provides one super-admin Settings surface for community-level feature and participation controls.
- R18. Super admins can control Voting, event creation, anonymous posting, signed-out posting, anonymous commenting, and anonymous replies.
- R19. Turning a setting off leaves the maintained module installed and preserves existing managed content unless the setting explicitly says otherwise.
- R20. Disabled behavior is enforced at both the interface and database boundary; hiding navigation or a form is not sufficient.
- R21. Only super admins can mutate community-level settings. Ordinary admins may manage content within currently available features but cannot redefine platform availability.
- R22. The organizer reviews the complete included platform and community profile before generating the launch brief.

**Tailored AI handoff**

- R23. Completion of the intake produces one copyable launch brief tailored to the organizer's community profile and the complete-platform contract.
- R24. The launch brief identifies the stable Local Community Platform release the agent must fetch and prohibits using Braga's downstream source or infrastructure.
- R25. The launch brief tells the agent to create an organizer-owned working copy and preserve a maintainable source history.
- R26. The launch brief includes known answers so the agent does not force the organizer to repeat the intake.
- R27. The launch brief instructs the agent to ask for the hero image only after the source is available locally.
- R28. The launch brief is vendor-neutral and tells the receiving agent to adapt commands and explanations to its own available tools.
- R29. If the receiving AI lacks file or command access, it must stop and explain the capability gap instead of fabricating progress.
- R30. The launcher provides recovery context that can restart the setup in a fresh agent session without containing credentials or private invitation links.

**Guided installation and provider setup**

- R31. The AI guides the organizer through source ownership, a new owner-controlled Supabase account and project, production authentication email, and a new owner-controlled Vercel account and project.
- R32. Provider setup is presented one account and one observable success state at a time.
- R33. The AI explains what each provider does before asking the organizer to create or configure it.
- R34. The AI distinguishes browser-safe values from secrets and keeps secrets out of tracked source, launcher state, screenshots, and public output.
- R35. The AI asks before paid upgrades, public deployment, custom-domain changes, DNS changes, or replacing an existing community link.
- R36. The AI applies the organizer-approved identity, platform language, inferred regional formatting and time zone, legal placeholders, and hero image to the complete installation.
- R37. The AI asks the organizer to review generated public copy and legal templates before public launch.
- R38. The AI applies the platform's owned migration chain and deployment configuration rather than recreating database rules manually.
- R39. The AI configures the external services required for the verified core launch. Optional alerts may remain unconfigured when their absence does not disable stored product behavior.
- R40. After deployment, the AI opens `/admin/settings`, confirms the organizer is a super admin, explains the controls in plain English, and verifies one reversible settings change at both interface and database boundaries.
- R41. Every guided step ends with an observable check before the agent proceeds.
- R42. The agent must report a blocker truthfully when a required provider, credential, email delivery, or deployment step cannot be verified.

**Launch verification**

- R43. The final public address must use HTTPS and render the organizer-approved community identity.
- R44. The organizer must successfully request and use a production passwordless login email at the public address.
- R45. The organizer must reach the organizer controls through the authenticated production session.
- R46. The organizer must create a real member invitation from the production installation.
- R47. The invitation must allow a controlled second user to complete the passwordless member-access flow.
- R48. The installation must show no Braga production URL, project identifier, credentials, private data, or community-specific copy outside intentionally reusable attribution.
- R49. The super-admin Settings page must load and save Voting, event creation, anonymous posting, and anonymous commenting controls correctly.
- R50. Every built module must remain present and load without an application error, but a complete end-to-end test of every workflow is not part of the first-version completion gate.
- R51. The flow cannot display a completed state until R43 through R50 pass.
- R52. The completion state presents the working public URL and a concise record of current super-admin settings.

---

## Key Flows

- F1. **Describe the community**
  - **Trigger:** An organizer follows **Create your community**.
  - **Actors:** A1
  - **Steps:** Confirm AI capability, answer grouped plain-language community questions, and approve the generated summary.
  - **Outcome:** The launcher has enough non-secret context to create a tailored handoff.

- F2. **Review the complete platform**
  - **Trigger:** The organizer completes the community description.
  - **Actors:** A1
  - **Steps:** Review the community facts and the complete list of installed capabilities without making technical feature choices.
  - **Outcome:** The organizer approves one full-platform launch scope and understands that super-admin Settings control availability after deployment.

- F3. **Hand the setup to an AI agent**
  - **Trigger:** The organizer confirms the launch scope.
  - **Actors:** A1, A2
  - **Steps:** Copy the tailored launch brief into a capable AI agent; the agent validates its tools, fetches the stable release, creates the organizer-owned working copy, and asks for the hero image.
  - **Outcome:** The agent begins from the canonical software and carries the organizer's approved context without asking for credentials in the launcher.

- F4. **Configure and deploy**
  - **Trigger:** The agent has the source and hero image.
  - **Actors:** A1, A2, A3
  - **Steps:** Apply identity to the complete platform, guide new owner-controlled provider setup, configure production email, deploy to Vercel, create the first super admin, verify Settings, and stop for approvals where required.
  - **Outcome:** An independent public installation exists under organizer-owned accounts.

- F5. **Prove the launch**
  - **Trigger:** The public deployment is reachable.
  - **Actors:** A1, A2, A4
  - **Steps:** Verify the homepage, complete organizer login, verify super-admin Settings, create an invitation, complete controlled second-member access, and record the final URL and settings state.
  - **Outcome:** The launcher may truthfully say the community platform is live.

- F6. **Recover from a lost AI session**
  - **Trigger:** The organizer loses the original agent context or changes capable agents.
  - **Actors:** A1, A2
  - **Steps:** Copy recovery context into a fresh session, let the new agent inspect the working copy and current provider state, and resume from the first unverified step.
  - **Outcome:** Setup continues without repeating the full intake or exposing secrets in the handoff.

---

## Acceptance Examples

- AE1. **Covers R5–R6 and R29.** Given an organizer selects a browser chat with no file or command access, the flow explains the mismatch and does not claim that the chat can install the platform.
- AE2. **Covers R15–R22.** Given an organizer reviews the platform, every built module is included without a launch-time feature questionnaire, and the handoff directs the first super admin to `/admin/settings` after deployment.
- AE3. **Covers R18–R21.** Given event creation is turned off, the browser hides the creation form and a stale or bypassed client still cannot insert a new event, while existing events remain manageable.
- AE4. **Covers R23–R29.** Given the launch brief is pasted into Hermes, Codex, Claude, or another capable agent, it fetches the named stable upstream release rather than Braga's downstream repository or a moving development branch.
- AE5. **Covers R12 and R27.** Given the organizer reaches the launcher handoff without an image, the flow still completes and the receiving agent asks for the hero image after fetching the source.
- AE6. **Covers R13, R30, and R34.** Given the organizer resumes in another agent session, the recovery context contains community choices and progress but no passwords, keys, tokens, or invitation URLs.
- AE7. **Covers R31–R33.** Given an organizer does not yet have Supabase, Vercel, GitHub, or production email configured, the agent introduces each required service when needed and verifies one success state before moving on.
- AE8. **Covers R43–R51.** Given the homepage is public but production login email fails, the installation remains incomplete.
- AE9. **Covers R46–R47.** Given an organizer can create an invitation but the controlled second user cannot complete member access, the installation remains incomplete.
- AE10. **Covers R48.** Given a deployed page or configuration still references Braga's production project, private data, or credentials, isolation verification fails and launch cannot complete.
- AE11. **Covers R49–R50.** Given the first super admin opens Settings, completion verifies the named controls load and save and confirms the complete platform remains installed; it does not require exercising every workflow end to end.
- AE12. **Covers R35 and R43.** Given the organizer uses the generated Vercel address, the launch can complete without a custom domain; DNS work remains optional and requires a separate approval.

---

## Success Criteria

- A non-technical organizer can move from the public launcher to a verified independent installation without reading the raw self-hosting guide as their primary path.
- The organizer understands what each required provider does and which credentials are private.
- The launcher receives and stores no provider credentials.
- Every completed installation proves public identity, organizer authentication, and first-member invitation access.
- Super-admin settings produce one maintainable application with truthful, database-enforced enabled and disabled states.
- The Braga implementation can be generalized upstream without changing the product promise or rebuilding the flow.

---

## Scope Boundaries

### Deferred for later

- Full end-to-end launch tests for every included module and settings combination.
- A manual setup path for users without a capable AI agent.
- Automatic custom-domain and DNS setup.
- Managed hosting, monitoring, updates, or support sold by the platform operator.
- Personalized source archives generated from intake answers.
- Multiple supported hosting and database providers in the same first-run flow.
- Server-side saved launcher projects, team collaboration, or cross-device progress sync.

### Outside this product's identity

- Asking AI to design and build a new community platform from a blank project.
- Operating all communities inside one Braga-owned or centrally managed multi-tenant database.
- Collecting customer-community credentials or member data in the launcher.
- Replacing the community's existing chat, social, or in-person channels.
- Creating unique code forks for different feature combinations.
- Automatic provider-account creation through OAuth, stored access tokens, or centrally held customer credentials.

---

## Dependencies and Assumptions

- Vercel and Supabase remain the one supported first-launch path for the current platform release.
- A maintainable installation requires an organizer-owned source home even though the launcher itself delivers prompts rather than source files.
- Production passwordless login requires transactional email configuration; Supabase's built-in test mailer cannot satisfy the launch gate.
- Community-level controls may govern availability or participation rather than uninstalling modules. Each control must define and test its interface and database behavior explicitly.
- Provider interfaces, limits, and pricing change. The guided flow must avoid relying on stale quota or price claims as launch truth.
- Legal pages remain configurable starter templates. The organizer is responsible for reviewing them for the community, jurisdiction, and providers before launch.
- The user demand evidence is currently an explicit product bet rather than a documented queue of outside organizers requesting installations. Early success should therefore measure completed launch briefs and verified independent communities, not page visits alone.

---

## Sources

- `AGENTS.md`
- `README.md`
- `docs/self-hosting.md`
- `src/config/community.ts`
- `src/components/Nav.astro`
- `src/lib/voting.ts`
