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
];

export const QUESTIONS_PER_SKILL = 10;

export const DIFFICULTY_MIX = Object.freeze({
  easy: 3,
  medium: 4,
  hard: 3,
});

export const isQuizSkill = (skillId) =>
  QUIZ_SKILL_IDS.includes(String(skillId).toLowerCase());

/** Human-readable names for quiz result titles / UI */
export const SKILL_DISPLAY_NAMES = Object.freeze({
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
});

/** e.g. "React — skill depth quiz" or "React · Node.js — skill depth quiz" */
export const formatQuizTitle = (skillIds) => {
  const uniq = [...new Set(skillIds.map((s) => String(s).toLowerCase()))];
  const parts = uniq.map((s) => SKILL_DISPLAY_NAMES[s] || s);
  if (parts.length === 0) return "Skill depth quiz";
  if (parts.length === 1) return `${parts[0]} — skill depth quiz`;
  return `${parts.join(" · ")} — skill depth quiz`;
};
