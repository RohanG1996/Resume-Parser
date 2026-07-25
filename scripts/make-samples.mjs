// Generates the sample resumes in /samples.
// Run with: npm run samples
//
// The set is deliberately varied to exercise different parts of the parser:
//   - fresher vs experienced, tech vs non-tech (domain generalisation)
//   - PDF and native DOCX (both extraction paths)
//   - one profile that is intentionally NOT recruiter-discoverable
//     (no headline, no city) to exercise the "Almost visible" state
//   - one with the location on the same line as the name, a career gap,
//     and a full-time/freelance/internship mix (the exact things the real
//     Naukri parser got wrong in the teardown)

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "samples");

const FRESHER = [
  ["h1", "ANANYA SHARMA"],
  ["sub", "Aspiring Frontend Developer"],
  ["meta", "Pune, Maharashtra | ananya.sharma23@gmail.com | +91 98220 44571"],
  ["meta", "linkedin.com/in/ananya-sharma-dev"],
  ["gap"],
  ["h2", "CAREER OBJECTIVE"],
  [
    "p",
    "Final-year computer engineering student seeking a frontend developer role where I can apply hands-on React experience from internships and personal projects to build products people actually use.",
  ],
  ["gap"],
  ["h2", "EDUCATION"],
  ["b", "B.E. Computer Engineering — Savitribai Phule Pune University (2022 – 2026), CGPA 8.7/10"],
  ["b", "HSC, Science — Fergusson College, Pune (2022), 91.2%"],
  ["gap"],
  ["h2", "INTERNSHIPS"],
  ["b", "Frontend Developer Intern — Quolam Business Solutions, Pune (Jun 2025 – Aug 2025)"],
  ["p2", "Built a React dashboard for client analytics used by 40+ internal users; cut page load time 35%."],
  ["b", "Web Development Intern — CodeClause (Remote) (Dec 2024 – Feb 2025)"],
  ["p2", "Developed responsive landing pages and a form-validation library in vanilla JavaScript."],
  ["gap"],
  ["h2", "PROJECTS"],
  ["b", "StudyCircle — peer study-group finder"],
  ["p2", "React + Firebase app matching students by subject and availability; 200+ signups in college pilot."],
  ["b", "RailAlert — train delay notifier"],
  ["p2", "Node.js service polling public rail APIs and pushing Telegram alerts; 150 daily active users."],
  ["gap"],
  ["h2", "KEY SKILLS"],
  ["p", "JavaScript, React, HTML, CSS, Tailwind CSS, Node.js, Express, Firebase, Git, REST APIs, SQL, Figma basics"],
  ["gap"],
  ["h2", "CERTIFICATIONS"],
  ["b", "Meta Front-End Developer Professional Certificate — Coursera (2025)"],
  ["b", "Responsive Web Design — freeCodeCamp (2024)"],
  ["gap"],
  ["h2", "LANGUAGES"],
  ["p", "English (professional), Hindi (native), Marathi (native)"],
];

const EXPERIENCED = [
  ["h1", "ROHIT VERMA"],
  ["sub", "Senior Product Manager"],
  ["meta", "Bengaluru, Karnataka | rohit.verma88@outlook.com | +91 99010 27364 | linkedin.com/in/rohitverma-pm"],
  ["gap"],
  ["h2", "PROFESSIONAL SUMMARY"],
  [
    "p",
    "Product manager with 6+ years across B2B SaaS and consumer fintech. Shipped 0-to-1 products at two startups and scaled a payments feature to 2M MAU at a listed company. Strong on discovery, analytics, and working directly with engineering.",
  ],
  ["gap"],
  ["h2", "WORK EXPERIENCE"],
  ["b", "Senior Product Manager — Razorpay, Bengaluru (Mar 2023 – Present)"],
  ["p2", "Own merchant onboarding; lifted activation 22% by collapsing KYC steps and adding parallel verification."],
  ["p2", "Led a 3-pod squad (11 engineers, 2 designers) through quarterly planning and delivery."],
  ["b", "Product Manager — Slice, Bengaluru (Jul 2020 – Feb 2023)"],
  ["p2", "Launched UPI on card rails; scaled to 2M monthly active users within 14 months."],
  ["b", "Associate Product Manager — Zoho, Chennai (Jun 2018 – Jun 2020)"],
  ["p2", "Shipped workflow automation for Zoho CRM used by 30k+ orgs."],
  ["gap"],
  ["h2", "EDUCATION"],
  ["b", "B.Tech, Information Technology — NIT Trichy (2014 – 2018), 8.1 CGPA"],
  ["gap"],
  ["h2", "KEY SKILLS"],
  ["p", "Product discovery, Roadmapping, SQL, Mixpanel, A/B testing, Stakeholder management, PRDs, Figma, JIRA, Payments/UPI domain, Agile"],
  ["gap"],
  ["h2", "CERTIFICATIONS"],
  ["b", "Certified Scrum Product Owner (CSPO) — Scrum Alliance (2021)"],
  ["gap"],
  ["h2", "LANGUAGES"],
  ["p", "English (fluent), Hindi (native), Tamil (conversational)"],
];

// Non-tech, experienced, fully discoverable. Tests that parsing generalises
// beyond software roles.
const NURSE = [
  ["h1", "PRIYA NAIR"],
  ["sub", "Registered Nurse — Critical Care"],
  ["meta", "Kochi, Kerala | priya.nair.rn@gmail.com | +91 94470 33218"],
  ["meta", "linkedin.com/in/priya-nair-rn"],
  ["gap"],
  ["h2", "PROFESSIONAL SUMMARY"],
  [
    "p",
    "Registered nurse with 5 years in critical care and emergency settings across two tertiary hospitals. Comfortable running ventilators, leading rapid-response situations, and mentoring junior staff on a busy ICU floor.",
  ],
  ["gap"],
  ["h2", "WORK EXPERIENCE"],
  ["b", "Staff Nurse, Critical Care — Aster Medcity, Kochi (Aug 2021 – Present)"],
  ["p2", "Primary nurse for a 12-bed medical ICU; managed ventilated and post-operative cardiac patients."],
  ["p2", "Trained 8 new joiners on EMR charting and the hospital's sepsis protocol."],
  ["b", "Staff Nurse, Emergency Department — Amrita Hospital, Kochi (Jul 2019 – Jul 2021)"],
  ["p2", "Triaged 40+ patients per shift; assisted in trauma and cardiac emergencies."],
  ["gap"],
  ["h2", "EDUCATION"],
  ["b", "B.Sc Nursing — Amrita School of Nursing, Kochi (2015 – 2019), 78%"],
  ["gap"],
  ["h2", "KEY SKILLS"],
  ["p", "Critical care, Ventilator management, IV therapy, Patient assessment, EMR/EHR, Wound care, Medication administration, Basic Life Support, Advanced Cardiac Life Support"],
  ["gap"],
  ["h2", "CERTIFICATIONS"],
  ["b", "Advanced Cardiac Life Support (ACLS) — American Heart Association (2022)"],
  ["b", "Basic Life Support (BLS) — American Heart Association (2023)"],
  ["b", "Registered with the Kerala Nurses and Midwives Council (2019)"],
  ["gap"],
  ["h2", "LANGUAGES"],
  ["p", "English (professional), Malayalam (native), Hindi (conversational), Tamil (conversational)"],
];

// Deliberately NOT recruiter-discoverable: no headline / objective line and no
// city anywhere in the document. Should land on the "Almost visible" state
// listing headline and city as the missing core fields.
const MINIMAL_FRESHER = [
  ["h1", "SAMEER KHAN"],
  ["meta", "sameer.khan.dev@gmail.com | +91 76540 98123"],
  ["gap"],
  ["h2", "EDUCATION"],
  ["b", "B.Tech Mechanical Engineering — Jamia Millia Islamia (2021 – 2025), 7.9 CGPA"],
  ["b", "Class XII, CBSE — Delhi Public School (2021), 88%"],
  ["gap"],
  ["h2", "PROJECTS"],
  ["b", "Solar-tracking mount"],
  ["p2", "Designed and 3D-printed a dual-axis solar tracker; improved panel output by roughly 18% in testing."],
  ["b", "Mini CNC plotter"],
  ["p2", "Built a two-axis pen plotter from salvaged stepper motors, controlled over an Arduino."],
  ["gap"],
  ["h2", "SKILLS"],
  ["p", "AutoCAD, SolidWorks, MATLAB, Python, Thermodynamics, Fluid mechanics, 3D printing, Arduino"],
  ["gap"],
  ["h2", "LANGUAGES"],
  ["p", "English, Hindi, Urdu"],
];

// Location on the SAME line as the name, a career gap, and a full-time /
// freelance / internship mix. Stress-tests header-location extraction and the
// separation of internships from employment.
const MARKETER = [
  ["h1", "FATIMA SHEIKH  —  Hyderabad, Telangana"],
  ["sub", "Marketing Manager — Brand & Growth"],
  ["meta", "fatima.sheikh.mktg@gmail.com | +91 90000 44556 | linkedin.com/in/fatima-sheikh"],
  ["gap"],
  ["h2", "PROFESSIONAL SUMMARY"],
  [
    "p",
    "Marketing manager with 6 years across edtech and food delivery, spanning brand, performance, and content. Took a planned one-year break in 2021 and returned to lead a growth pod. Happiest where creative and analytics meet.",
  ],
  ["gap"],
  ["h2", "WORK EXPERIENCE"],
  ["b", "Marketing Manager — Zomato, Hyderabad (Feb 2022 – Present)"],
  ["p2", "Own brand and lifecycle marketing for the Hyderabad region; grew monthly reorders 19%."],
  ["p2", "Ran the festive campaign that added 120k new users in one quarter."],
  ["b", "Career break (Jan 2021 – Dec 2021) — relocation and family, with freelance consulting"],
  ["b", "Assistant Marketing Manager — Byju's, Bengaluru (Jun 2018 – Dec 2020)"],
  ["p2", "Managed paid social across Meta and Google; cut blended CAC 24% over 18 months."],
  ["gap"],
  ["h2", "INTERNSHIPS"],
  ["b", "Marketing Intern — Ogilvy, Mumbai (May 2017 – Jul 2017)"],
  ["p2", "Supported account planning for two FMCG brands; ran competitor and social listening decks."],
  ["gap"],
  ["h2", "EDUCATION"],
  ["b", "BBA, Marketing — Christ University, Bengaluru (2014 – 2017), 8.4 CGPA"],
  ["gap"],
  ["h2", "KEY SKILLS"],
  ["p", "Brand strategy, Performance marketing, SEO, Google Ads, Meta Ads, Content strategy, Marketing analytics, CRM, Campaign management, Copywriting"],
  ["gap"],
  ["h2", "LANGUAGES"],
  ["p", "English (fluent), Hindi (native), Telugu (conversational)"],
];

// Native DOCX, exercised through mammoth. Career switcher (finance to data),
// with a full-time history plus one internship.
const DATA_ANALYST = [
  ["h1", "MARCUS D'SOUZA"],
  ["sub", "Data Analyst"],
  ["meta", "Mumbai, Maharashtra | marcus.dsouza@gmail.com | +91 98670 11245 | linkedin.com/in/marcus-dsouza"],
  ["gap"],
  ["h2", "PROFESSIONAL SUMMARY"],
  [
    "p",
    "Data analyst who moved from investment banking into product analytics. Three years turning messy event data into decisions for operations and growth teams. Fluent in SQL and Python, and happy to own a dashboard end to end.",
  ],
  ["gap"],
  ["h2", "WORK EXPERIENCE"],
  ["b", "Data Analyst — Swiggy, Mumbai (Apr 2022 – Present)"],
  ["p2", "Built the delivery-partner supply dashboard used daily by 30+ city managers."],
  ["p2", "Ran the A/B test that reworked surge pricing, adding an estimated 4% to weekend order volume."],
  ["b", "Financial Analyst — Morgan Stanley, Mumbai (Jun 2019 – Mar 2022)"],
  ["p2", "Modelled portfolio risk for a $2B book; automated a monthly report that saved two analyst-days."],
  ["gap"],
  ["h2", "INTERNSHIPS"],
  ["b", "Business Analyst Intern — Deloitte, Mumbai (May 2018 – Jul 2018)"],
  ["p2", "Supported a supply-chain diagnostic for a retail client; cleaned and reconciled 12 data sources."],
  ["gap"],
  ["h2", "EDUCATION"],
  ["b", "MBA, Finance — NMIMS, Mumbai (2017 – 2019), 3.6/4"],
  ["b", "B.Com — St. Xavier's College, Mumbai (2014 – 2017), 8.2 CGPA"],
  ["gap"],
  ["h2", "KEY SKILLS"],
  ["p", "SQL, Python, Pandas, Tableau, Power BI, Excel, A/B testing, Statistics, dbt, Snowflake, Data visualisation"],
  ["gap"],
  ["h2", "CERTIFICATIONS"],
  ["b", "Google Data Analytics Professional Certificate — Coursera (2022)"],
  ["b", "Tableau Desktop Specialist — Tableau (2021)"],
  ["gap"],
  ["h2", "LANGUAGES"],
  ["p", "English (fluent), Hindi (native), Konkani (native)"],
];

async function makePdf(blocks) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]); // A4
  const left = 56;
  const width = 595 - left * 2;
  let y = 842 - 60;

  const wrap = (text, f, size) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > width) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const draw = (text, f, size, color, indent = 0, gapAfter = 4) => {
    for (const line of wrap(text, f, size)) {
      if (y < 60) {
        page = doc.addPage([595, 842]);
        y = 842 - 60;
      }
      page.drawText(line, { x: left + indent, y, size, font: f, color });
      y -= size + 4;
    }
    y -= gapAfter;
  };

  const ink = rgb(0.12, 0.15, 0.2);
  const blue = rgb(0.04, 0.36, 0.76);
  const gray = rgb(0.35, 0.4, 0.47);

  for (const [kind, text] of blocks) {
    if (kind === "gap") {
      y -= 10;
    } else if (kind === "h1") {
      draw(text, bold, 20, ink, 0, 2);
    } else if (kind === "sub") {
      draw(text, font, 12, blue, 0, 3);
    } else if (kind === "meta") {
      draw(text, font, 10, gray, 0, 2);
    } else if (kind === "h2") {
      draw(text, bold, 12, blue, 0, 3);
    } else if (kind === "b") {
      draw(text, bold, 10.5, ink, 0, 2);
    } else if (kind === "p") {
      draw(text, font, 10.5, ink, 0, 2);
    } else if (kind === "p2") {
      draw("- " + text, font, 10, gray, 12, 2);
    }
  }
  return doc.save();
}

// Same block format rendered to a native .docx via the docx library.
// Sizes are in half-points; colours are hex without the leading #.
async function makeDocx(blocks) {
  const children = [];
  const para = (runs, spacing) => new Paragraph({ children: runs, spacing });

  for (const [kind, text] of blocks) {
    if (kind === "gap") {
      children.push(para([new TextRun("")], { after: 120 }));
    } else if (kind === "h1") {
      children.push(para([new TextRun({ text, bold: true, size: 40, color: "1F2733" })]));
    } else if (kind === "sub") {
      children.push(para([new TextRun({ text, size: 24, color: "0A5CC2" })]));
    } else if (kind === "meta") {
      children.push(para([new TextRun({ text, size: 20, color: "5A6673" })]));
    } else if (kind === "h2") {
      children.push(para([new TextRun({ text, bold: true, size: 24, color: "0A5CC2" })], { before: 160, after: 60 }));
    } else if (kind === "b") {
      children.push(para([new TextRun({ text, bold: true, size: 21, color: "1F2733" })]));
    } else if (kind === "p") {
      children.push(para([new TextRun({ text, size: 21, color: "1F2733" })]));
    } else if (kind === "p2") {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text, size: 20, color: "5A6673" })],
        })
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

await mkdir(outDir, { recursive: true });

await writeFile(path.join(outDir, "Ananya Sharma.pdf"), await makePdf(FRESHER));
await writeFile(path.join(outDir, "Rohit Verma.pdf"), await makePdf(EXPERIENCED));
await writeFile(path.join(outDir, "Priya Nair.pdf"), await makePdf(NURSE));
await writeFile(path.join(outDir, "Sameer Khan.pdf"), await makePdf(MINIMAL_FRESHER));
await writeFile(path.join(outDir, "Fatima Sheikh.pdf"), await makePdf(MARKETER));
await writeFile(path.join(outDir, "Marcus D'Souza.docx"), await makeDocx(DATA_ANALYST));

console.log("Wrote 6 sample resumes to /samples (5 PDF, 1 DOCX)");
