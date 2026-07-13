import { completeness } from "../lib/profile.js";

export default function SuccessScreen({ profile, onStartOver }) {
  const pct = completeness(profile);
  const stats = [
    [profile.keySkills.length, "skills"],
    [profile.employment.length + profile.internships.length, "roles & internships"],
    [profile.education.length, "education entries"],
    [profile.projects.length, "projects"],
  ].filter(([n]) => n > 0);

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
          Profile created. You're at <em>{pct}%</em> already.
        </h1>
        <p className="sub">
          {profile.fullName ? `${profile.fullName}, your` : "Your"} profile is ready. Add the
          remaining details whenever you like, then start applying.
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
