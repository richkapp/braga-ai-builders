---
date: 2026-07-14
topic: community-voting
---

# Community Voting Requirements

## Summary

Add a public Voting tab where admins publish time-bounded votes and signed-in members choose one of up to ten options. Results remain live and public, while each member may hide their identity with a per-ballot anonymity choice.

---

## Key Decisions

- **Public visibility.** Anyone may browse active votes, closed votes, and live results; only signed-in active members may submit ballots.
- **Single-choice ballots.** Each member selects one option and may change that selection until the vote closes.
- **Named by default.** A ballot displays the member's name publicly unless they check **Vote anonymously**.
- **Live results.** Counts, percentages, and turnout are visible before a visitor or member votes.
- **Multiple active votes.** Open votes appear newest first, while closed votes remain available beneath them as the archive.
- **Integrity after participation.** Admins may edit a published vote until its first ballot; after that, its content and deadline are locked.
- **Permanent participated votes.** A vote with ballots may be closed early but cannot be deleted or reopened.

---

## Actors

- A1. **Visitor:** May browse votes and results but cannot submit a ballot.
- A2. **Active member:** May browse, vote once per open vote, change their ballot before closure, and choose whether their name is public.
- A3. **Admin:** May create, preview, publish, edit eligible votes, close votes early, and remove drafts or zero-ballot votes.

---

## Requirements

**Voting catalog and visibility**

- R1. The primary navigation includes a **Voting** tab that opens the public voting catalog.
- R2. The catalog shows open votes newest first and closed votes in a clearly separated archive.
- R3. Each vote displays its title, description, options, closing time, lifecycle state, total turnout, option counts, and option percentages.
- R4. Public visitors may see live results and named ballots without signing in.
- R5. Public visitors receive a clear sign-in prompt instead of ballot controls.

**Admin creation and lifecycle**

- R6. Only admins may create, edit, publish, close, or delete votes.
- R7. Vote creation requires a title, description, a future closing date and time, and between 2 and 10 non-empty distinct options.
- R8. Admins may save a draft, preview it, and publish it when ready.
- R9. Multiple votes may be open concurrently.
- R10. Admins may edit a published vote only while it has no ballots.
- R11. The first accepted ballot locks the title, description, options, and closing time against further edits.
- R12. Admins may close an open vote before its deadline, and a closed vote cannot be reopened.
- R13. Drafts and published votes with zero ballots may be deleted.
- R14. Votes with at least one ballot cannot be deleted and remain available in the closed archive.
- R15. A vote closes automatically when its required closing time passes.

**Member ballots and privacy**

- R16. Only signed-in active members may submit or change a ballot.
- R17. Each member has at most one current ballot per vote.
- R18. A member may change their selected option until the vote closes, and only the latest selection counts.
- R19. Ballots are named by default, with an unchecked **Vote anonymously** checkbox beside submission controls.
- R20. A member may change both their selected option and anonymity setting until the vote closes.
- R21. Named ballots display the member's public name beneath the selected option to every viewer.
- R22. Anonymous ballots contribute to counts, percentages, and turnout without exposing the member's name or avatar on public or admin surfaces.
- R23. Anonymous and named ballots use the same one-ballot-per-member rule.
- R24. A closed vote rejects new ballots and changes to existing ballots.

**Results and feedback**

- R25. Results update after a successful ballot without requiring a page reload.
- R26. Every ballot submission or change has explicit loading, success, and failure feedback.
- R27. Percentages use the total current ballots as the denominator and display zero when turnout is zero.

---

## Key Flows

- F1. **Admin creates and publishes a vote**
  - **Trigger:** An admin opens the vote-management surface.
  - **Actors:** A3
  - **Steps:** Enter required fields and 2–10 options, save or preview the draft, then publish it.
  - **Outcome:** The vote appears in the public catalog according to its publication state.

- F2. **Member submits or changes a ballot**
  - **Trigger:** An active member opens an open vote.
  - **Actors:** A2
  - **Steps:** Select one option, optionally check **Vote anonymously**, submit, and receive confirmation; repeat before closure to change the ballot.
  - **Outcome:** Only the member's latest selection counts, and results refresh immediately.

- F3. **Visitor browses live results**
  - **Trigger:** A visitor opens the Voting tab.
  - **Actors:** A1
  - **Steps:** Browse active or closed votes and inspect totals, percentages, and publicly named ballots.
  - **Outcome:** Results are readable without authentication, while ballot controls direct the visitor to sign in.

- F4. **Vote closes**
  - **Trigger:** The deadline passes or an admin closes the vote early.
  - **Actors:** A2, A3
  - **Steps:** The vote transitions to closed, rejects ballot mutations, and moves to the closed archive.
  - **Outcome:** Final results remain public and the vote cannot be reopened or deleted if it has ballots.

---

## Acceptance Examples

- AE1. **Covers R7.** Given an admin enters only one option, duplicate options, or more than ten options, publishing is rejected with a useful validation message.
- AE2. **Covers R10–R11.** Given a published vote has no ballots, an admin may edit it; once its first ballot is accepted, the same edit is rejected.
- AE3. **Covers R17–R18.** Given a member already voted for option A, changing to option B moves their single ballot rather than increasing turnout.
- AE4. **Covers R19–R23.** Given a member checks **Vote anonymously**, their ballot affects option totals but no viewer or admin surface associates their identity with that option.
- AE5. **Covers R21.** Given a member leaves anonymity unchecked, their public name appears beneath the option they selected for signed-in and signed-out viewers.
- AE6. **Covers R15 and R24.** Given a vote's closing time passes between page load and submission, the submission is rejected and the refreshed vote appears closed.
- AE7. **Covers R12–R14.** Given an admin closes a vote with ballots, the vote remains in the archive and cannot be reopened or deleted.
- AE8. **Covers R3 and R27.** Given a vote has no ballots, every option shows zero votes and zero percent without division or rendering errors.

---

## Scope Boundaries

The first version excludes:

- Comments or discussion threads on votes.
- Multiple selections per member.
- Ranked-choice or weighted voting.
- Email or external notifications.
- Images attached to votes or options.
- Per-vote public/private visibility settings.
- Reopening participated votes or hard-deleting their history.
