import { useState } from "react";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import ReviewScreen from "./screens/ReviewScreen.jsx";
import SuccessScreen from "./screens/SuccessScreen.jsx";
import { emptyProfile, filledSections } from "./lib/profile.js";

export default function App() {
  const [stage, setStage] = useState("register"); // register | review | success
  const [parsedProfile, setParsedProfile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fromResume, setFromResume] = useState(new Set());
  const [fileName, setFileName] = useState("");

  function handleParsed(built, name) {
    setParsedProfile(built);
    setFileName(name);
  }

  // Merge the registration form over the parsed profile (user edits win),
  // then hand the whole thing to the review screen.
  function handleRegister(form) {
    const base = parsedProfile ? { ...parsedProfile } : emptyProfile();
    base.hasResume = !!parsedProfile;
    base.fullName = form.fullName.trim();
    base.email = form.email.trim();
    base.phone = form.phone.trim();
    base.workStatus = form.workStatus;
    setProfile(base);
    setFromResume(parsedProfile ? filledSections(parsedProfile) : new Set());
    setStage("review");
  }

  function handleStartOver() {
    setParsedProfile(null);
    setProfile(null);
    setFromResume(new Set());
    setFileName("");
    setStage("register");
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="wordmark" onClick={handleStartOver} title="Start over">
          <span className="wordmark-doc" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <rect width="32" height="32" rx="8" fill="var(--blue)" />
              <path d="M9 8h10l4 4v12H9z" fill="#fff" />
              <path
                d="M12 15h8M12 18h8M12 21h5"
                stroke="var(--blue)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Resume<em>First</em>
        </button>
        <span className="topbar-right">
          Already Registered? <span className="linkish">Login</span> here
        </span>
      </header>

      <main>
        {stage === "register" && (
          <RegisterScreen onParsed={handleParsed} onRegister={handleRegister} />
        )}
        {stage === "review" && (
          <ReviewScreen
            profile={profile}
            setProfile={setProfile}
            fromResume={fromResume}
            fileName={fileName}
            onConfirm={() => setStage("success")}
          />
        )}
        {stage === "success" && <SuccessScreen profile={profile} onStartOver={handleStartOver} />}
      </main>

      <footer className="footer">
        Design prototype for a product case study. Nothing you enter is saved.
      </footer>
    </div>
  );
}
