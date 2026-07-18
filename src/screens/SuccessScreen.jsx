import { completeness, isDiscoverable, missingCoreFields } from "../lib/profile.js";

function listMissing(profile) {
  const labels = missingCoreFields(profile).map((m) => m.label);
  if (labels.length === 1) return labels[0];
  return labels.slice(0, -1).join(", ") + " and " + labels[labels.length - 1];
}

export default function SuccessScreen({ profile, onStartOver }) {
  const pct = completeness(profile);
  const visible = isDiscoverable(profile);
  const stats = [
    [profile.keySkills.length, "skills"],
    [profile.employment.length + profile.internships.length, "roles & internships"],
    [profile.education.length, "education entries"],
    [profile.projects.length, "projects"],
    [pct + "%", "complete"],
  ].filter(([n]) => n !== 0 && n !== "0%");

  return (
    <section className="screen success-screen">
      <div className="success-card">
        <div className="success-check" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
            <circle cx="32" cy="32" r="30" fill="var(--blue)" />
            <path
              d="M20 33.5 28 41l16-17"
              stroke="#fff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1>
          {visible ? (
            <>
              Your profile is live and <em>visible to recruiters</em>.
            </>
          ) : (
            <>Your profile is live.</>
          )}
        </h1>
        <p className="sub">
          {visible ? (
            <>
              {profile.fullName ? `${profile.fullName}, recruiters` : "Recruiters"} can now find
              you in search. Start applying whenever you're ready.
            </>
          ) : (
            <>
              {profile.fullName ? `${profile.fullName}, add` : "Add"} {listMissing(profile)} to
              become visible to recruiters. Everything you entered is on your profile.
            </>
          )}
        </p>
        {stats.length > 0 && (
          <ul className="success-stats">
            {stats.map(([n, label]) => (
              <li key={label}>
                <strong>{n}</strong>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="side-note">This is a prototype. Nothing you entered was saved.</p>
        <button className="btn ghost" onClick={onStartOver}>
          Try another resume
        </button>
      </div>
    </section>
  );
}
