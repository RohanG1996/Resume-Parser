# Change Request — Discoverable Threshold State (demote the completeness ring)

> Handoff for Claude Code, against the built prototype ([RohanG1996/Resume-Parser](https://github.com/RohanG1996/Resume-Parser)). One focused change: add a "visible to recruiters" threshold state as the primary status, and demote the completeness ring to a secondary indicator.

---

## Context

This prototype is the working artifact for a design case study whose core metric is:

> **% of new users whose profile becomes recruiter-discoverable — headline, key skills, education, location, and resume attached — within 48 hours of signup.**

User research showed people ignore percentage-completion mechanics and stop at their own "good enough" bar, so the design argument is: **show the moment the profile becomes discoverable, and never nag past it.** The current build has the completeness ring as the primary status on the review screen — that needs to become secondary to a new discoverable state.

---

## 1. Add a discoverability check

Probably in `src/lib/profile.js`, alongside the completeness scorer. The profile is **discoverable** when all five of these are non-empty:

1. `headline`
2. `keySkills` — at least 1
3. `education` — at least 1 entry
4. location — city present
5. the resume file itself — always true after an upload; **false on the pure-manual path** until one is added

Export it as a helper, e.g. `isDiscoverable(profile)`. The five fields must match this list exactly — it mirrors the metric definition in the case study's design brief, and a reviewer may check the correspondence.

---

## 2. Review screen (`ReviewScreen.jsx`) — discoverable state becomes the primary status

- **In the sticky sidebar, above the ring:** when `isDiscoverable` is true, show a green confirmed banner.
  - Copy: **"You're visible to recruiters"**
  - Sub-line: "Recruiters can now find you in search."
  - Product voice, no exclamation marks.
- **When false:** the same slot shows a neutral (not alarming) state — **"Almost visible to recruiters"** — listing *only* the missing core field(s) with add-links (e.g. "Add your education to become visible"). Never list optional fields here. No percentages anywhere in this component.
- **The completeness ring stays but demoted:** smaller, below the banner, presented as supporting detail rather than the headline. It must never prompt action — "complete your profile" style copy is out.
- **The "Not in your resume" section** (DOB, gender, expected salary, preferred location) gets a small header line making its status explicit: *"Optional — recruiters can already find you without these."* Render that line only when discoverable is true.

---

## 3. Success screen (`SuccessScreen.jsx`)

Lead with the discoverable state — **"Your profile is live and visible to recruiters"** — not the completeness figure. Keep the parsed-item counts. The completeness number can stay as a secondary stat or be dropped; your judgment.

---

## 4. Registration screen

No changes needed, except — if it's cheap — after a successful parse, the dropzone's success message may add one clause: *"your profile is ready to go live."* Skip if it clutters.

---

## 5. README

Update the real-vs-mocked / behaviour notes to describe the discoverable threshold (the five fields) and that the ring is a secondary indicator. One or two sentences.

---

## Copy rules

Follow the project's existing §7 house style: product voice, short sentences, no em-dash chains, status/error messages say what's true and what's next. **"Discoverable" is case-study language — on screens, always "visible to recruiters."**

---

## Acceptance

- Upload either sample resume → review screen shows the green **"You're visible to recruiters"** banner (both samples cover the five fields) → ring appears below it, visibly secondary.
- Manually clear the education section → banner switches to the "almost" state naming education only → re-add → green returns.
- Pure-manual path (no resume uploaded) → banner correctly withholds visibility until a resume is attached.
- Success screen leads with visibility, not percentage.
- No component introduced by this change displays a percentage or prompts completion.
