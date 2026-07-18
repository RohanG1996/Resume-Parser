# Resume-First Registration — Build Plan v2 (as built)

> Supersedes `resume_parser_build_plan.md`. Where v1 was the handoff spec, this is the record of what actually got built, what changed along the way and why, and what remains open. Written 8 Jul 2026, after the build was completed, verified end to end with real resumes, and pushed to GitHub.

**Status:** complete. Built and verified locally with a real Gemini key, code on GitHub at [RohanG1996/Resume-Parser](https://github.com/RohanG1996/Resume-Parser), deployed to Vercel and verified live by Rohan on 8 Jul 2026.

---

## 1. The intent, revised

v1 framed the prototype as an inversion of Naukri's flow: a standalone resume-upload screen before everything else. During the build this was deliberately reframed as an **enhancement of Naukri's existing registration page**, not a replacement of it. The page mirrors Naukri's real layout (sidebar, form card, work-status cards, register button) with one structural change: a resume dropzone sits at the top of the form as its first field. Drop a resume in and the fields below fill themselves from a genuine parse.

Why the reframe matters for the case study: "would Naukri ship this?" is easier to answer yes to when the change is one module on a page they already have. The side-by-side against the real registration page also becomes self-explanatory, because everything except the dropzone looks familiar.

## 2. The flow, as built

v1 specified three screens. The build has two, plus a success state:

1. **Registration page** (`src/screens/RegisterScreen.jsx`). Naukri-style layout. Dropzone first, then Full name, Email, Password, Mobile (+91), Work status cards, promo checkbox, Register button. Parsing happens inline inside the dropzone (scan animation, cycling messages), so v1's separate "parsing screen" no longer exists. On success the dropzone turns green, the form fields fill with a highlight flash and "from your resume" tags, and work status auto-selects with an "inferred from your resume" tag. On failure the dropzone turns red with the error, retry and re-upload actions, and the form still available below. Manual entry is not a hidden link as in v1; the full form is simply there.
2. **Profile review** (`src/screens/ReviewScreen.jsx`). Reached via Register (name and email required, nothing else validated). The full profile built from the parse: basic details, headline and summary, skills as chips, employment, internships, education, projects, certifications, languages, plus a "Not in your resume" section for fields the document genuinely lacks (DOB, gender, expected salary, preferred location). Sticky sidebar with an animated completeness ring and the confirm button.
3. **Success state** (`src/screens/SuccessScreen.jsx`). Completeness figure, counts of parsed items, "try another resume". Nothing is persisted.

Other deliberate departures from v1:

- **The work-status fork stays on the form.** v1 said remove it. Since the page now mirrors Naukri's, the cards remain, but the parse answers the question before the user does. The critique survives in softer form: the product shouldn't need to ask.
- **Copy is written in product voice.** Case-study language ("born pre-filled", "day zero") was removed from the UI in a dedicated copy pass. The design argument lives in the README and the scope doc, not on the screens.

## 3. Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vite 6 + React 18, JavaScript, plain CSS | Single stylesheet, `src/styles.css` |
| PDF extraction | `pdfjs-dist` in the browser | Line breaks rebuilt from text-item Y positions |
| DOCX extraction | `mammoth` (browser build) | |
| RTF extraction | Small regex stripper in `extractText.js` | v1's "if cheap" — it was |
| DOC extraction | `word-extractor` in a serverless function | Not in v1's build; see §4 |
| Parsing | Gemini `gemini-2.5-flash` via REST | v1 said `gemini-1.5-flash`, which was retired |
| Hosting | Vercel: static frontend + two functions under `/api` | Free tier |

Extraction libraries are lazy-loaded on first file drop, which keeps the initial bundle at ~165KB instead of ~1MB.

## 4. Extraction pipeline

`src/lib/extractText.js` routes by extension, enforces the 2MB limit, and normalizes output (NBSP to space, collapsed blank lines). A file whose extracted text is under 40 non-whitespace characters is treated as unreadable and gets the scanned-image error.

- **PDF, DOCX, RTF:** extracted entirely in the browser. The file never leaves the machine; only the text goes to the API.
- **DOC (Word 97–2003):** no browser-side reader exists for the old binary format, so these files are sent base64-encoded to `api/extract-doc.js`, which runs `word-extractor` and returns plain text. This is the one exception to the text-only-over-the-wire rule, and the README says so. Added mid-build when a real `.doc` test file needed it; v1 had scoped DOC out.
- **Image-only PDFs** (pages exported as pictures, no text layer): rejected with an accurate, actionable error. OCR remains out of scope by decision, recorded in the scope doc on 8 Jul 2026. If it's ever wanted, the cheap path is pdf.js rendering pages to images and the same Gemini endpoint reading them multimodally, on the same free tier. For the case study this is framed as a known, feasible extension, not a gap.

## 5. The parse function

`api/parse.js`, a Vercel serverless function. Exists so the Gemini key stays in `process.env` and never reaches the browser.

- Accepts POST `{ resumeText }`, rejects empty or sub-40-character input with a 400.
- Calls `gemini-2.5-flash` with the v1 extraction prompt unchanged (schema plus the rules targeting the observed Naukri parser gaps: no heading bleed into values, parse location from the header line, separate internships from employment, infer `workStatus`, preserve date ranges as written).
- `generationConfig`: temperature 0, `responseMimeType: "application/json"`, and `thinkingConfig: { thinkingBudget: 0 }`. The thinking budget wasn't in v1; disabling it cut parse latency from ~10s to ~3s with no quality loss on the test resumes.
- Robust JSON handling as specified in v1: strips markdown fences if present, falls back to outermost braces, try/catch around `JSON.parse`, normalizes missing keys to null/[] so the UI never crashes.
- Errors return readable messages: 400 for bad input, 502 for network/model failures, a specific message for rate limits, and a "not configured" message when the key is missing. The placeholder value `your_key_here` is treated as missing — this guard exists because the shipped `.env` contains that placeholder.
- Input capped at 24,000 characters before the prompt is built.
- Model overridable via `GEMINI_MODEL` env var.

## 6. Profile model and completeness

`src/lib/profile.js` defines the profile shape, builds it from the parse (trimming strings, mapping `isCurrent` to "Present"), and scores completeness out of 100 with per-field weights. Resume-fillable fields carry ~95 of the 100 points, which is the point: a parsed profile scores high on arrival (86–89% with the sample resumes), inverting Naukri's 0%-plus-15-missing-details wall. The ring animates from zero on mount. Weights live in one table in that file if they ever need tuning.

The registration form's values win over the parse on Register (user edits are authoritative). The parsed phone number has any leading +91 stripped before display, because the field renders its own +91 prefix.

## 7. Copy rules

A full copy pass was done against AI-writing tells (em-dash chains, triads, negative parallelisms, case-study jargon in product copy). House style for any future strings:

- Product voice on screens. The user is a job seeker, not a portfolio reviewer.
- Short sentences over dash-spliced ones. At most the occasional em dash where it genuinely earns its place.
- Error messages say what happened and what to do next, in that order, without blaming the user or the network wrongly.
- The prototype disclosure appears as one plain line ("This is a prototype. Nothing you enter is saved."), not as a recurring triad.

## 8. What's real vs. mocked

**Real:** drag-and-drop upload (PDF/DOCX/DOC/RTF, 2MB), client-side extraction, Gemini parsing of any uploaded resume, inline form pre-fill, work-status inference, the editable review screen, live completeness scoring, graceful failure states.

**Mocked or out of scope:** no database, auth, OTP, or account creation; Confirm shows a success state and stores nothing. Password and promo checkbox are decorative. No OCR. No mobile-app view. The "Login" link and Terms/Privacy links are inert.

## 9. Running it

**Local:**

1. `npm install`
2. Copy `.env.example` to `.env`, paste a Gemini key (free at aistudio.google.com).
3. `npm run dev` — a Vite middleware serves both `/api` routes locally, so the whole flow works without the Vercel CLI. This middleware statically imports the handlers, so changes to `api/*.js` need a dev-server restart.
4. Test files live in `/samples`: two generated PDFs (fresher and experienced personas, regenerable with `npm run samples`) and one real legacy `.doc`.

Two environment quirks discovered on the build machine, both handled:

- The corporate network intercepts TLS, which Node distrusts by default (browsers use the Windows cert store, Node doesn't). The `dev` script therefore runs `node --use-system-ca`. Vercel is unaffected.
- The dev server reads `.env` at startup; a key added later needs a restart to be picked up.

**Deploy:** import the GitHub repo in Vercel (Vite preset auto-detects, both functions under `/api` are picked up automatically), set `GEMINI_API_KEY` in Settings → Environment Variables, deploy. `.env` is gitignored and the key appears nowhere in the repo or bundle (verified by grepping `dist/`).

## 10. Acceptance checks

From v1, with verified status:

| Check | Status |
|---|---|
| Any text-based PDF/DOCX resume produces a genuinely pre-filled, editable profile within a few seconds | Verified locally with real Gemini parses (~3s), both sample personas and a real `.doc` |
| Section headings don't bleed into field values | Verified ("CAREER OBJECTIVE" correctly stripped from summary) |
| Header location captured | Verified (Pune/Maharashtra and Bengaluru/Karnataka, the two cases the real Naukri parser missed) |
| Internships separated from employment; workStatus inferred | Verified (fresher inferred from internships-only resume, experienced from the PM resume) |
| Broken/empty/scanned files produce a clear, non-dead-end error | Verified with two image-only PDFs |
| Gemini key absent from browser bundle and repo | Verified |
| Live Vercel URL works end to end | Verified by Rohan on the deployed site, 8 Jul 2026 |

## 11. Open items

- When writing the case study: include the enhancement-over-redesign decision (§1), the inline pre-fill moment (§2), the `.doc` addition (§4), and the image-resume extension note (§4 and the scope doc's Prototype Notes, 8 Jul 2026).
- Re-check "free tier" claims for Gemini and Vercel before publishing.

## Appendix: what changed from v1, in one list

1. Standalone upload screen → Naukri-mirroring registration page with the dropzone as the form's first field (enhancement framing).
2. Separate parsing screen removed; parsing and pre-fill happen inline on the registration page.
3. Work-status fork kept on the form, auto-answered by the parse instead of removed.
4. Manual path is the visible form itself, not a link to an empty screen.
5. Legacy `.doc` support added via a second serverless function (`word-extractor`), with the disclosed exception to the text-only-over-the-wire rule.
6. Model is `gemini-2.5-flash` with thinking disabled (v1 named the retired `gemini-1.5-flash`).
7. Local `/api` middleware in `vite.config.js` replaces any dependence on the Vercel CLI for development.
8. `--use-system-ca` added to the dev script for corporate TLS interception.
9. Placeholder API key treated as unconfigured.
10. UI copy rewritten in product voice; case-study language confined to docs.
11. Extraction libraries lazy-loaded (initial bundle ~1MB → ~165KB).
12. Sample set includes a real legacy `.doc` alongside the two generated PDFs.
