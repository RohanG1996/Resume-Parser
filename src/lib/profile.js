// Profile shape used by the review screen, plus helpers to build it from the
// parser output and score its completeness.

export function emptyProfile() {
  return {
    hasResume: false,
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    linkedinUrl: "",
    headline: "",
    summary: "",
    workStatus: "",
    keySkills: [],
    employment: [],
    internships: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    // Fields a resume genuinely never contains — the honest residue.
    dob: "",
    gender: "",
    expectedSalary: "",
    preferredLocation: "",
  };
}

const s = (v) => (typeof v === "string" ? v.trim() : "");

export function profileFromParse(parsed) {
  const p = emptyProfile();
  p.fullName = s(parsed.fullName);
  p.email = s(parsed.email);
  p.phone = s(parsed.phone);
  p.city = s(parsed.location?.city);
  p.state = s(parsed.location?.state);
  p.linkedinUrl = s(parsed.linkedinUrl);
  p.headline = s(parsed.headline);
  p.summary = s(parsed.summary);
  p.workStatus = parsed.workStatus === "fresher" || parsed.workStatus === "experienced" ? parsed.workStatus : "";
  p.keySkills = (parsed.keySkills || []).map(s).filter(Boolean);
  p.employment = (parsed.employment || []).map((e) => ({
    title: s(e.title),
    company: s(e.company),
    location: s(e.location),
    startDate: s(e.startDate),
    endDate: e.isCurrent ? "Present" : s(e.endDate),
  }));
  p.internships = (parsed.internships || []).map((e) => ({
    title: s(e.title),
    company: s(e.company),
    startDate: s(e.startDate),
    endDate: s(e.endDate),
  }));
  p.education = (parsed.education || []).map((e) => ({
    degree: s(e.degree),
    institution: s(e.institution),
    startYear: s(e.startYear),
    endYear: s(e.endYear),
    score: s(e.score),
  }));
  p.certifications = (parsed.certifications || []).map((c) => ({
    name: s(c.name),
    issuer: s(c.issuer),
    year: s(c.year),
  }));
  p.projects = (parsed.projects || []).map((pr) => ({
    name: s(pr.name),
    description: s(pr.description),
  }));
  p.languages = (parsed.languages || []).map((l) => ({
    language: s(l.language),
    proficiency: s(l.proficiency),
  }));
  return p;
}

// Weighted completeness out of 100. Resume-fillable fields carry most of the
// weight, which is the point: a parsed profile should be born scoring high.
const WEIGHTS = [
  ["fullName", 8, (p) => !!p.fullName],
  ["email", 7, (p) => !!p.email],
  ["phone", 7, (p) => !!p.phone],
  ["location", 6, (p) => !!p.city || !!p.state],
  ["headline", 7, (p) => !!p.headline],
  ["summary", 10, (p) => !!p.summary],
  ["workStatus", 4, (p) => !!p.workStatus],
  ["keySkills", 12, (p) => p.keySkills.length > 0],
  ["experience", 13, (p) => p.employment.length > 0 || p.internships.length > 0],
  ["education", 12, (p) => p.education.length > 0],
  ["projects", 3, (p) => p.projects.length > 0],
  ["certifications", 2, (p) => p.certifications.length > 0],
  ["languages", 2, (p) => p.languages.length > 0],
  ["linkedinUrl", 3, (p) => !!p.linkedinUrl],
  ["dob", 1, (p) => !!p.dob],
  ["gender", 1, (p) => !!p.gender],
  ["expectedSalary", 1, (p) => !!p.expectedSalary],
  ["preferredLocation", 1, (p) => !!p.preferredLocation],
];

export function completeness(profile) {
  let score = 0;
  for (const [, weight, filled] of WEIGHTS) {
    if (filled(profile)) score += weight;
  }
  return Math.min(100, score);
}

// The recruiter-discoverable threshold. These five requirements mirror the
// case study's metric definition exactly — change them only if the brief does:
// headline, at least one key skill, at least one education entry, a city,
// and a resume attached to the profile.
const CORE_REQUIREMENTS = [
  ["headline", "a headline", (p) => !!p.headline],
  ["keySkills", "your key skills", (p) => p.keySkills.length > 0],
  ["education", "your education", (p) => p.education.length > 0],
  ["city", "your city", (p) => !!p.city],
  ["resume", "a resume", (p) => !!p.hasResume],
];

export function missingCoreFields(profile) {
  return CORE_REQUIREMENTS.filter(([, , ok]) => !ok(profile)).map(([key, label]) => ({
    key,
    label,
  }));
}

export function isDiscoverable(profile) {
  return missingCoreFields(profile).length === 0;
}

// Which sections the parser actually filled — used for "from your resume" tags.
export function filledSections(profile) {
  const filled = new Set();
  for (const [key, , isFilled] of WEIGHTS) {
    if (isFilled(profile)) filled.add(key);
  }
  return filled;
}
