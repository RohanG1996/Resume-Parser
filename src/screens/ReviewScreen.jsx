import CompletenessRing from "../components/CompletenessRing.jsx";
import ChipsInput from "../components/ChipsInput.jsx";
import Field from "../components/Field.jsx";
import EntryList from "../components/EntryList.jsx";
import { completeness, isDiscoverable, missingCoreFields } from "../lib/profile.js";

// Primary status: the recruiter-visibility threshold. Shows what's true and,
// when short of it, only the missing core fields. Never a percentage.
function VisibilityBanner({ profile }) {
  if (isDiscoverable(profile)) {
    return (
      <div className="vis-banner on">
        <span className="vis-dot" aria-hidden="true" />
        <div>
          <strong>You're visible to recruiters</strong>
          <p>Recruiters can now find you in search.</p>
        </div>
      </div>
    );
  }
  const missing = missingCoreFields(profile);
  return (
    <div className="vis-banner off">
      <span className="vis-dot" aria-hidden="true" />
      <div>
        <strong>Almost visible to recruiters</strong>
        <ul>
          {missing.map((m) => (
            <li key={m.key}>Add {m.label} to become visible</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Section({ title, tag, children, index }) {
  return (
    <section className="card" style={{ "--stagger": index }}>
      <div className="card-head">
        <h3>{title}</h3>
        {tag && <span className="tag from-resume">from your resume</span>}
      </div>
      {children}
    </section>
  );
}

export default function ReviewScreen({ profile, setProfile, fromResume, fileName, onConfirm }) {
  const pct = completeness(profile);
  const set = (key) => (value) => setProfile({ ...profile, [key]: value });
  const has = (key) => fromResume.has(key);
  const parsedAnything = fromResume.size > 0;

  return (
    <section className="screen review-screen">
      <aside className="review-side">
        <VisibilityBanner profile={profile} />
        <div className="ring-secondary">
          <CompletenessRing value={pct} small />
        </div>
        <p className="side-blurb">
          {parsedAnything ? (
            <>
              We built this profile
              {fileName && (
                <>
                  {" "}
                  from <span className="side-file">{fileName}</span>
                </>
              )}
              . Check it over and fix anything we got wrong, then confirm.
            </>
          ) : (
            <>Fill in what matters and confirm when you're ready.</>
          )}
        </p>
        <button className="btn primary big" onClick={onConfirm}>
          Confirm &amp; create profile
        </button>
        <p className="side-note">This is a prototype. Nothing you enter is saved.</p>
      </aside>

      <div className="review-main">
        <Section title="Basic details" tag={has("fullName") || has("email")} index={0}>
          <div className="field-grid">
            <Field label="Full name" value={profile.fullName} onChange={set("fullName")} placeholder="Your name" />
            <Field label="Email" value={profile.email} onChange={set("email")} placeholder="you@example.com" half />
            <Field label="Phone" value={profile.phone} onChange={set("phone")} placeholder="+91 …" half />
            <Field label="City" value={profile.city} onChange={set("city")} placeholder="City" half />
            <Field label="State" value={profile.state} onChange={set("state")} placeholder="State" half />
            <Field label="LinkedIn" value={profile.linkedinUrl} onChange={set("linkedinUrl")} placeholder="linkedin.com/in/…" />
          </div>
          <div className="work-status">
            <span className="field-label">Work status</span>
            <div className="seg">
              {["fresher", "experienced"].map((ws) => (
                <button
                  key={ws}
                  className={"seg-btn" + (profile.workStatus === ws ? " on" : "")}
                  onClick={() => set("workStatus")(ws)}
                >
                  {ws === "fresher" ? "Fresher" : "Experienced"}
                </button>
              ))}
            </div>
            {has("workStatus") && (
              <span className="tag from-resume subtle">inferred from your resume</span>
            )}
          </div>
        </Section>

        <Section title="Headline & summary" tag={has("headline") || has("summary")} index={1}>
          <div className="field-grid">
            <Field label="Headline" value={profile.headline} onChange={set("headline")} placeholder="e.g. Frontend Developer" />
            <Field label="Professional summary" value={profile.summary} onChange={set("summary")} placeholder="A few lines about you" textarea />
          </div>
        </Section>

        <Section title="Key skills" tag={has("keySkills")} index={2}>
          <ChipsInput
            values={profile.keySkills}
            onChange={set("keySkills")}
            placeholder="Type a skill and press Enter"
          />
        </Section>

        <Section title="Employment" tag={has("experience") && profile.employment.length > 0} index={3}>
          <EntryList
            entries={profile.employment}
            onChange={set("employment")}
            addLabel="Add employment"
            titleOf={(e) => [e.title, e.company].filter(Boolean).join(" · ")}
            fields={[
              { key: "title", label: "Job title", half: true },
              { key: "company", label: "Company", half: true },
              { key: "location", label: "Location", half: true },
              { key: "startDate", label: "Start", half: true },
              { key: "endDate", label: "End (or Present)", half: true },
            ]}
          />
        </Section>

        <Section title="Internships" tag={has("experience") && profile.internships.length > 0} index={4}>
          <EntryList
            entries={profile.internships}
            onChange={set("internships")}
            addLabel="Add internship"
            titleOf={(e) => [e.title, e.company].filter(Boolean).join(" · ")}
            fields={[
              { key: "title", label: "Role", half: true },
              { key: "company", label: "Organisation", half: true },
              { key: "startDate", label: "Start", half: true },
              { key: "endDate", label: "End", half: true },
            ]}
          />
        </Section>

        <Section title="Education" tag={has("education")} index={5}>
          <EntryList
            entries={profile.education}
            onChange={set("education")}
            addLabel="Add education"
            titleOf={(e) => [e.degree, e.institution].filter(Boolean).join(" · ")}
            fields={[
              { key: "degree", label: "Degree / course", half: true },
              { key: "institution", label: "Institution", half: true },
              { key: "startYear", label: "Start year", half: true },
              { key: "endYear", label: "End year", half: true },
              { key: "score", label: "Score / CGPA", half: true },
            ]}
          />
        </Section>

        <Section title="Projects" tag={has("projects")} index={6}>
          <EntryList
            entries={profile.projects}
            onChange={set("projects")}
            addLabel="Add project"
            titleOf={(e) => e.name}
            fields={[
              { key: "name", label: "Project name" },
              { key: "description", label: "Description", textarea: true },
            ]}
          />
        </Section>

        <Section title="Certifications" tag={has("certifications")} index={7}>
          <EntryList
            entries={profile.certifications}
            onChange={set("certifications")}
            addLabel="Add certification"
            titleOf={(e) => e.name}
            fields={[
              { key: "name", label: "Certification", half: true },
              { key: "issuer", label: "Issuer", half: true },
              { key: "year", label: "Year", half: true },
            ]}
          />
        </Section>

        <Section title="Languages" tag={has("languages")} index={8}>
          <EntryList
            entries={profile.languages}
            onChange={set("languages")}
            addLabel="Add language"
            titleOf={(e) => e.language}
            fields={[
              { key: "language", label: "Language", half: true },
              { key: "proficiency", label: "Proficiency", half: true },
            ]}
          />
        </Section>

        <Section title="Not in your resume" index={9}>
          <p className="section-hint">
            {isDiscoverable(profile)
              ? "Optional — recruiters can already find you without these."
              : "Your resume didn't mention these. Add them if you want to."}
          </p>
          <div className="field-grid">
            <Field label="Date of birth" value={profile.dob} onChange={set("dob")} type="date" half />
            <Field label="Gender" value={profile.gender} onChange={set("gender")} placeholder="Optional" half />
            <Field label="Expected salary" value={profile.expectedSalary} onChange={set("expectedSalary")} placeholder="e.g. 4–6 LPA" half />
            <Field label="Preferred work location" value={profile.preferredLocation} onChange={set("preferredLocation")} placeholder="e.g. Pune, Remote" half />
          </div>
        </Section>

        <div className="review-footer">
          <button className="btn primary big" onClick={onConfirm}>
            Confirm &amp; create profile
          </button>
        </div>
      </div>
    </section>
  );
}
