# Phase 2: Service Configuration — Update for Juliet & Mark

**Subject:** Hop Aboard — Phase 2 (Service Configuration) is built

Hi Juliet and Mark,

Phase 2 of the onboarding flow is built out and ready for review. Here's what's new.

## Service Configuration (Sections 11 & 12)

Section 11 presents every service category the client selected back in Section 3 (labs, imaging, immunizations, DME, specialist care, etc.) as collapsible accordions. Inside each one, they toggle individual sub-services on or off. Labs alone has ~120 items grouped by clinical category, imaging has 80+, and so on. Select All / Deselect All controls are included per category.

Section 12 is a review and submit screen for Phase 2 — it shows a summary of all selections with counts per category before final submission.

Phase 2 only becomes visible to a client after an admin explicitly unlocks it. Until then, they just see the original Sections 1–10.

## Multi-Phase Submission

Each phase now tracks its own submission lifecycle independently (DRAFT → SUBMITTED). Phase 1 submission works the same as before. Phase 2 has its own submit flow gated behind Section 11 being fully complete. Once a phase is submitted, its sections are locked and can't be edited unless an admin unlocks it.

## Admin Controls

The admin affiliate detail view now shows a Phase Progression card with status badges and timestamps for each phase. Admins can:

- **Unlock Phase 2** — available once Phase 1 is submitted
- **Unlock for editing** — resets a submitted phase back to draft so the client can make changes
- **Lock a phase** — admin override to force-submit

## Nav Improvements

- Sections are grouped under collapsible phase headers in the sidebar
- Submitted phases auto-collapse and show a summary line (e.g., "Submitted — 9/9 complete")
- An amber dot appears next to any section with unsaved changes and clears on save
- A full-screen loading overlay prevents accidental clicks during save operations

Juliet — Phase 2 is already unlocked on your account. You can try it now at https://hop-aboard.vercel.app.

Happy to walk through any of this. Let me know if you have questions.

Best,
Joe
