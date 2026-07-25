import { useEffect, useRef, useState } from "react";
import { parseResume } from "../lib/parseResume.js";
import { profileFromParse } from "../lib/profile.js";

const ACCEPT = ".pdf,.docx,.doc,.rtf";

const PARSE_MSGS = [
  "Reading your resume…",
  "Extracting your experience…",
  "Spotting your skills…",
  "Filling the form below…",
];

export default function RegisterScreen({ onParsed, onRegister }) {
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const lastFile = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | parsing | done | error
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    workStatus: "",
  });
  const [prefilled, setPrefilled] = useState(new Set());
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (phase !== "parsing") return;
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % PARSE_MSGS.length), 1600);
    return () => clearInterval(id);
  }, [phase]);

  async function handleFile(file) {
    lastFile.current = file;
    setFileName(file.name);
    setError(null);
    setMsgIndex(0);
    setPhase("parsing");
    try {
      const { extractText } = await import("../lib/extractText.js");
      const text = await extractText(file);
      const parsed = await parseResume(text);
      const built = profileFromParse(parsed);
      onParsed(built, file.name);
      const filled = new Set();
      const next = { ...form };
      if (built.fullName) (next.fullName = built.fullName), filled.add("fullName");
      if (built.email) (next.email = built.email), filled.add("email");
      if (built.phone) {
        // The +91 prefix is already rendered on the field.
        next.phone = built.phone.replace(/^\+?91[\s-]+/, "").trim();
        filled.add("phone");
      }
      if (built.workStatus) (next.workStatus = built.workStatus), filled.add("workStatus");
      setForm(next);
      setPrefilled(filled);
      setPhase("done");
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  function set(key) {
    return (value) => {
      setForm((f) => ({ ...f, [key]: value }));
      setFormError(null);
    };
  }

  function register() {
    if (!form.fullName.trim() || !form.email.trim()) {
      setFormError("Please add at least your name and email to continue.");
      return;
    }
    onRegister(form);
  }

  const mark = (key) => (prefilled.has(key) ? " prefilled" : "");

  return (
    <section className="screen reg-page">
      <aside className="reg-side">
        <div className="reg-side-art" aria-hidden="true">
          <svg viewBox="0 0 96 96" width="88" height="88" fill="none">
            <circle cx="48" cy="48" r="44" fill="var(--blue-wash)" />
            <path d="M34 26h22l10 10v34H34z" fill="#fff" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M56 26v10h10" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M41 48h14M41 55h14M41 62h9" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="70" cy="24" r="3" fill="var(--orange)" />
            <circle cx="24" cy="66" r="2.5" fill="var(--orange)" />
          </svg>
        </div>
        <h2>On registering, you can</h2>
        <ul className="reg-perks">
          <li>Start applying right away with a profile already built from your resume</li>
          <li>Let recruiters find you from day one</li>
          <li>Get job postings delivered right to your email</li>
        </ul>
      </aside>

      <div className="reg-card">
        <h1>Create your profile</h1>
        <p className="reg-sub">Start with your resume and we'll do the typing.</p>

        <div className="reg-body">
          <div className="reg-form" ref={formRef}>
            {/* The thesis: the resume is the first field of the form. */}
            {phase === "idle" && (
              <div
                className={"dropzone" + (dragging ? " dragging" : "")}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                }}
                aria-label="Upload your resume"
              >
                <div className="dropzone-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
                    <path d="M12 6h16l8 8v28H12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M28 6v8h8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M24 34v-12m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="dropzone-text">
                  <p className="dropzone-main">
                    {/* Drag-and-drop language only applies with a pointer; on
                        touch (<768px) the whole card is the tap target. */}
                    <span className="dz-pointer">
                      Drop your resume here, or <span className="linkish">browse</span>
                    </span>
                    <span className="dz-touch">Upload your resume</span>
                  </p>
                  <p className="dropzone-meta">
                    PDF, DOC or DOCX up to 2MB. We'll fill the form
                    <span className="dz-pointer"> below</span> in seconds.
                  </p>
                </div>
              </div>
            )}

            {phase === "parsing" && (
              <div className="dropzone state parsing">
                <div className="doc-scan small" aria-hidden="true">
                  <svg viewBox="0 0 64 80" width="46" height="58" fill="none">
                    <rect x="4" y="4" width="56" height="72" rx="6" fill="#fff" stroke="var(--line-strong)" strokeWidth="2" />
                    <rect x="14" y="16" width="24" height="5" rx="2.5" fill="var(--blue)" opacity="0.9" />
                    <rect x="14" y="28" width="36" height="3.5" rx="1.75" fill="var(--line-strong)" />
                    <rect x="14" y="36" width="36" height="3.5" rx="1.75" fill="var(--line-strong)" />
                    <rect x="14" y="44" width="28" height="3.5" rx="1.75" fill="var(--line-strong)" />
                    <rect x="14" y="56" width="36" height="3.5" rx="1.75" fill="var(--line-strong)" />
                  </svg>
                  <div className="scan-beam" />
                </div>
                <div className="dropzone-text">
                  <p className="dropzone-main" key={msgIndex}>
                    {PARSE_MSGS[msgIndex]}
                  </p>
                  <p className="dropzone-meta">{fileName}</p>
                  <div className="parse-track">
                    <div className="parse-track-fill" />
                  </div>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="dropzone state done">
                <div className="done-check" aria-hidden="true">
                  <svg viewBox="0 0 40 40" width="34" height="34" fill="none">
                    <circle cx="20" cy="20" r="18" fill="var(--green)" />
                    <path d="m12.5 20.5 5 5 10-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="dropzone-text">
                  <p className="dropzone-main">
                    We've filled the form from your resume. It's ready to go live.
                  </p>
                  <p className="dropzone-meta">
                    {fileName} ·{" "}
                    <button className="text-btn" onClick={() => inputRef.current?.click()}>
                      upload a different file
                    </button>
                  </p>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="dropzone state error">
                <div className="dropzone-icon err" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="34" height="34" fill="none">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                    <path d="M24 15v11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx="24" cy="32" r="1.8" fill="currentColor" />
                  </svg>
                </div>
                <div className="dropzone-text">
                  <p className="dropzone-main">{error}</p>
                  <p className="dropzone-meta">
                    <button className="text-btn" onClick={() => lastFile.current && handleFile(lastFile.current)}>
                      Try again
                    </button>{" "}
                    ·{" "}
                    <button className="text-btn" onClick={() => inputRef.current?.click()}>
                      upload a different file
                    </button>{" "}
                    · or just fill the form below
                  </p>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />

            {phase === "idle" && (
              <p className="reg-manual-note">
                No resume handy? Fill the form below and add one later.
              </p>
            )}

            <label className={"reg-field" + mark("fullName")}>
              <span className="reg-label">
                Full name<em>*</em>
                {prefilled.has("fullName") && <span className="tag from-resume">from your resume</span>}
              </span>
              <input
                value={form.fullName}
                placeholder="What is your name?"
                onChange={(e) => set("fullName")(e.target.value)}
              />
            </label>

            <label className={"reg-field" + mark("email")}>
              <span className="reg-label">
                Email ID<em>*</em>
                {prefilled.has("email") && <span className="tag from-resume">from your resume</span>}
              </span>
              <input
                type="email"
                value={form.email}
                placeholder="Tell us your Email ID"
                onChange={(e) => set("email")(e.target.value)}
              />
              <span className="reg-hint">We'll send relevant jobs and updates to this email</span>
            </label>

            <label className="reg-field">
              <span className="reg-label">
                Password<em>*</em>
              </span>
              <input
                type="password"
                value={form.password}
                placeholder="(Minimum 6 characters)"
                onChange={(e) => set("password")(e.target.value)}
              />
              <span className="reg-hint">This helps your account stay protected</span>
            </label>

            <label className={"reg-field" + mark("phone")}>
              <span className="reg-label">
                Mobile number<em>*</em>
                {prefilled.has("phone") && <span className="tag from-resume">from your resume</span>}
              </span>
              <div className={"phone-wrap" + mark("phone")}>
                <span className="phone-prefix">+91</span>
                <input
                  value={form.phone}
                  placeholder="Enter your mobile number"
                  onChange={(e) => set("phone")(e.target.value)}
                />
              </div>
              <span className="reg-hint">Recruiters will contact you on this number</span>
            </label>

            <div className="reg-field">
              <span className="reg-label">
                Work status<em>*</em>
                {prefilled.has("workStatus") && (
                  <span className="tag from-resume">inferred from your resume</span>
                )}
              </span>
              <div className="ws-cards">
                <button
                  type="button"
                  className={"ws-card" + (form.workStatus === "experienced" ? " on" : "")}
                  onClick={() => set("workStatus")("experienced")}
                >
                  <strong>I'm experienced</strong>
                  <span>I have work experience (excluding internships)</span>
                </button>
                <button
                  type="button"
                  className={"ws-card" + (form.workStatus === "fresher" ? " on" : "")}
                  onClick={() => set("workStatus")("fresher")}
                >
                  <strong>I'm a fresher</strong>
                  <span>I am a student / haven't worked after graduation</span>
                </button>
              </div>
            </div>

            <label className="reg-check">
              <input type="checkbox" />
              <span>Send me important updates &amp; promotions via SMS, email and WhatsApp</span>
            </label>

            <p className="reg-terms">
              By clicking Register, you agree to the <span className="linkish">Terms and Conditions</span>{" "}
              &amp; <span className="linkish">Privacy Policy</span> of this prototype (nothing is stored).
            </p>

            {formError && <p className="reg-form-error">{formError}</p>}

            <button className="btn primary reg-submit" onClick={register}>
              Register now
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
