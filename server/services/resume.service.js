import { PDFParse } from "pdf-parse";

export const SKILL_MASTER_LIST = [
  "react",
  "nodejs",
  "mongodb",
  "sql",
  "python",
  "java",
  "dsa",
  "restapi",
  "systemdesign",
  "git",
  "javascript",
  "typescript",
  "express",
  "nextjs",
  "redux",
  "tailwind",
  "bootstrap",
  "html",
  "css",
  "mysql",
  "postgresql",
  "firebase",
  "docker",
  "aws",
  "linux",
  "c",
  "cpp",
  "php",
  "django",
  "flask",
  "spark",
  "hadoop",
  "selenium",
  "cypress",
  "jest",
  "mocha",
  "powerbi",
  "tableau",
  "flutter",
  "kotlin"
];
export const ROLE_REQUIRED_SKILLS = {
  frontend: [
    "react",
    "javascript",
    "html",
    "css",
    "git",
    "redux",
    "typescript",
  ],
  backend: [
    "nodejs",
    "mongodb",
    "sql",
    "restapi",
    "git",
    "systemdesign",
    "dsa",
  ],
  fullstack: [
    "react",
    "nodejs",
    "mongodb",
    "restapi",
    "git",
    "javascript",
    "sql",
  ],
  data: ["python", "sql", "mongodb", "flask", "postgresql", "dsa", "git"],
  java: ["java", "sql", "dsa", "git", "systemdesign", "mysql", "restapi"],
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Map common resume wording to canonical skill tokens so substring checks are not fooled
 * (e.g. Node.js → nodejs, "java" inside JavaScript → not java).
 */
export const normalizeResumeText = (raw) => {
  let t = raw.toLowerCase();

  t = t.replace(/\bnode\.js\b/gi, "nodejs");
  t = t.replace(/\bnode\s+js\b/gi, "nodejs");
  t = t.replace(/\bnode\b(?=\s*(?:express|nestjs|npm|backend|runtime))/gi, "nodejs");
  t = t.replace(/\bnext\.js\b/gi, "nextjs");
  t = t.replace(/\bnext\s+js\b/gi, "nextjs");

  t = t.replace(/\brest\s*api\b/gi, "restapi");
  t = t.replace(/\brestful(?:\s+api)?\b/gi, "restapi");

  t = t.replace(/\b(?:system\s+design|system-design|systems\s+design)\b/gi, "systemdesign");

  t = t.replace(/\bmongo\s*db\b/gi, "mongodb");

  t = t.replace(
    /\b(?:data\s+structures?\s*(?:&|and)\s*algorithms?|data\s+structures?\s+(?:and\s+)?algorithms?|ds\s+and\s+algo|ds\s*&\s*algo)\b/gi,
    " dsa "
  );
  t = t.replace(/\bdsa\b/gi, "dsa");

  t = t.replace(/\bmy\s*sql\b/gi, "mysql");
  t = t.replace(/\bpostgres(?:ql)?\b/gi, "postgresql");

  return t;
};

/** True if the skill appears as its own word/phrase, not as a substring of another word (e.g. java vs javascript). */
export const skillMatchesText = (normalized, skill) => {
  if (skill === "c") {
    return /\bc(?!\+{2})\b/i.test(normalized);
  }
  if (skill === "cpp") {
    return /\bc\+\+\b|\bcpp\b|\bg\+\+\b/i.test(normalized);
  }

  const escaped = escapeRegex(skill);
  return new RegExp(`\\b${escaped}\\b`, "i").test(normalized);
};


export const extractText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text || "";
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`PDF_EXTRACTION_FAILED: ${error.message}`);
  } finally {
    try {
       await parser.destroy();
    } catch {
       /* ignore cleanup error */
    }
  }
};

export const detectSkills = (text, targetRole) => {
  const normalized = normalizeResumeText(text);

  const detectedSkills = SKILL_MASTER_LIST.filter((skill) =>
    skillMatchesText(normalized, skill)
  );

  const roleRequiredSkills = ROLE_REQUIRED_SKILLS[targetRole] || [];

  const missingSkills = roleRequiredSkills.filter(
    (skill) => !detectedSkills.includes(skill)
  );

  const coveredCount = roleRequiredSkills.filter((skill) =>
    detectedSkills.includes(skill)
  ).length;

  const coveragePercent =
    roleRequiredSkills.length > 0
      ? Math.round((coveredCount / roleRequiredSkills.length) * 100)
      : 0;

  return {
    detectedSkills,
    missingSkills,
    roleRequiredSkills,
    coveragePercent,
    message: `${coveredCount} of ${roleRequiredSkills.length} required skills detected in your resume for the ${targetRole} role.`,
  };
};
