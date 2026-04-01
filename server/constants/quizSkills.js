/** Core tech categories that support Basic / Mid / Advanced tier quizzes */
export const TIER_QUIZ_BASE_SKILLS = [
  "javascript",
  "typescript",
  "java",
  "python",
  "sql",
  "nodejs",
  "react",
  "mongodb",
];

const TIER_SUFFIXES = ["basic", "mid", "advanced"];

/** Maps URL/API segment -> questions.json difficulty */
export const TIER_TO_DIFFICULTY = Object.freeze({
  basic: "easy",
  mid: "medium",
  advanced: "hard",
});

const tierSkillIds = TIER_QUIZ_BASE_SKILLS.flatMap((b) =>
  TIER_SUFFIXES.map((s) => `${b}_${s}`)
);

export const QUIZ_SKILL_IDS = [
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
  "general",
  "aptitude",
  "frontendfundamentals",
  "backendfundamentals",
  "dbms",
  "oop",
  "devops",
  "problemsolving",
  "aptitudeplus",
  "datascience",
  "cloud",
  "security",
  ...tierSkillIds,
];

export const QUESTIONS_PER_SKILL = 10;

export const DIFFICULTY_MIX = Object.freeze({
  easy: 3,
  medium: 4,
  hard: 3,
});

export const isQuizSkill = (skillId) =>
  QUIZ_SKILL_IDS.includes(String(skillId).toLowerCase());

/** e.g. javascript_basic -> { base: "javascript", tier: "basic", difficulty: "easy" } */
export const parseTierQuizSkill = (skillId) => {
  const s = String(skillId || "").toLowerCase().trim();
  const m = s.match(
    /^(javascript|typescript|java|python|sql|nodejs|react|mongodb)_(basic|mid|advanced)$/
  );
  if (!m) return null;
  const tier = m[2];
  return {
    base: m[1],
    tier,
    difficulty: TIER_TO_DIFFICULTY[tier],
  };
};

const BASE_DISPLAY = Object.freeze({
  react: "React",
  nodejs: "Node.js",
  mongodb: "MongoDB",
  sql: "SQL",
  python: "Python",
  java: "Java",
  dsa: "DSA",
  restapi: "REST APIs",
  systemdesign: "System Design",
  git: "Git",
  javascript: "JavaScript",
  typescript: "TypeScript",
  general: "General CS",
  aptitude: "Aptitude",
  frontendfundamentals: "Frontend Fundamentals",
  backendfundamentals: "Backend Fundamentals",
  dbms: "DBMS",
  oop: "OOP",
  devops: "DevOps",
  problemsolving: "Problem Solving",
  aptitudeplus: "Aptitude Plus",
  datascience: "Data Science",
  cloud: "Cloud",
  security: "Security",
});

const TIER_DISPLAY = Object.freeze({
  basic: "Basic",
  mid: "Mid",
  advanced: "Advanced",
});

const tierDisplayNames = Object.fromEntries(
  TIER_QUIZ_BASE_SKILLS.flatMap((b) =>
    TIER_SUFFIXES.map((s) => {
      const id = `${b}_${s}`;
      return [
        id,
        `${BASE_DISPLAY[b] || b} (${TIER_DISPLAY[s]})`,
      ];
    })
  )
);

/** Human-readable names for quiz result titles / UI */
export const SKILL_DISPLAY_NAMES = Object.freeze({
  ...BASE_DISPLAY,
  ...tierDisplayNames,
});

/** e.g. "React — skill depth quiz" or "JavaScript (Basic) — skill depth quiz" */
export const formatQuizTitle = (skillIds) => {
  const uniq = [...new Set(skillIds.map((s) => String(s).toLowerCase()))];
  const parts = uniq.map((s) => SKILL_DISPLAY_NAMES[s] || s);
  if (parts.length === 0) return "Skill depth quiz";
  if (parts.length === 1) return `${parts[0]} — skill depth quiz`;
  return `${parts.join(" · ")} — skill depth quiz`;
};
