// Generates the sample resumes in /samples as text-based PDFs.
// Run with: npm run samples

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "samples");

const FRESHER = [
  ["h1", "ANANYA SHARMA"],
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

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "sample-fresher-ananya-sharma.pdf"), await makePdf(FRESHER));
await writeFile(path.join(outDir, "sample-experienced-rohit-verma.pdf"), await makePdf(EXPERIENCED));
console.log("Wrote 2 sample resumes to /samples");
