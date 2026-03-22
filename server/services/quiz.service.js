import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  QUIZ_SKILL_IDS,
  QUESTIONS_PER_SKILL,
  DIFFICULTY_MIX,
  isQuizSkill,
} from "../constants/quizSkills.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _bank = null;

const loadBank = () => {
  if (_bank) return _bank;
  const p = path.join(__dirname, "../data/questions.json");
  _bank = JSON.parse(readFileSync(p, "utf8"));
  return _bank;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const TIER_ORDER = ["easy", "medium", "hard"];

const normalizeDifficulty = (q) => {
  const d = String(q.difficulty || "medium").toLowerCase();
  return TIER_ORDER.includes(d) ? d : "medium";
};

export const pickStratifiedQuestions = (pool, count = QUESTIONS_PER_SKILL) => {
  if (!pool?.length || pool.length < count) {
    return null;
  }

  const byTier = { easy: [], medium: [], hard: [] };
  for (const q of pool) {
    byTier[normalizeDifficulty(q)].push(q);
  }

  const pickedIds = new Set();
  const result = [];

  for (const tier of TIER_ORDER) {
    const quota = DIFFICULTY_MIX[tier] ?? 0;
    const bucket = shuffle([...byTier[tier]]);
    let taken = 0;
    while (taken < quota && result.length < count && bucket.length) {
      const q = bucket.pop();
      if (!pickedIds.has(q.id)) {
        result.push(q);
        pickedIds.add(q.id);
        taken++;
      }
    }
  }

  const remainder = shuffle(pool.filter((q) => !pickedIds.has(q.id)));
  while (result.length < count && remainder.length) {
    result.push(remainder.pop());
  }

  if (result.length < count) {
    return null;
  }

  return shuffle(result.slice(0, count));
};

export const depthLevelFromScore = (score) => {
  if (score <= 40) return "Beginner";
  if (score <= 70) return "Intermediate";
  return "Advanced";
};


export const buildQuizSession = (skillIds) => {
  const bank = loadBank();
  const unique = [
    ...new Set(
      skillIds
        .map((s) => String(s).toLowerCase().trim())
        .filter((s) => isQuizSkill(s))
    ),
  ];

  if (unique.length === 0) {
    throw new Error("NO_QUIZ_SKILLS");
  }

  const questions = [];
  for (const skill of unique) {
    const pool = bank[skill];
    const picked = pickStratifiedQuestions(pool, QUESTIONS_PER_SKILL);
    if (!picked) {
      throw new Error(`INSUFFICIENT_QUESTIONS:${skill}`);
    }
    for (const q of picked) {
      questions.push({
        id: q.id,
        skill,
        difficulty: normalizeDifficulty(q),
        question: q.question,
        options: q.options,
      });
    }
  }

  const shuffled = shuffle(questions);
  return {
    questions: shuffled,
    totalQuestions: shuffled.length,
    skills: unique,
    questionsPerSkill: QUESTIONS_PER_SKILL,
    difficultyMix: { ...DIFFICULTY_MIX },
  };
};

const getQuestionMap = () => {
  const bank = loadBank();
  const idToQ = new Map();
  for (const skill of QUIZ_SKILL_IDS) {
    const list = bank[skill] || [];
    for (const q of list) {
      idToQ.set(q.id, { ...q, skill });
    }
  }
  return idToQ;
};

/** Per-question rows for the results UI (correct / incorrect, text, indices). */
export const buildQuestionReviews = (answers) => {
  const idToQ = getQuestionMap();
  const reviews = [];
  for (const a of answers) {
    const q = idToQ.get(a.questionId);
    if (!q) continue;
    const selectedIndex = Number.isInteger(a.selectedIndex)
      ? a.selectedIndex
      : -1;
    const isCorrect = selectedIndex === q.correctIndex;
    reviews.push({
      questionId: q.id,
      question: q.question,
      skill: q.skill,
      difficulty: normalizeDifficulty(q),
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
    });
  }
  return reviews;
};

export const gradeQuiz = (answers) => {
  const idToQ = getQuestionMap();

  const bySkill = {};
  for (const skill of QUIZ_SKILL_IDS) {
    bySkill[skill] = { correct: 0, total: 0 };
  }

  const bySkillTier = {};

  for (const a of answers) {
    const q = idToQ.get(a.questionId);
    if (!q) continue;
    if (!bySkill[q.skill]) bySkill[q.skill] = { correct: 0, total: 0 };
    bySkill[q.skill].total += 1;
    const tier = normalizeDifficulty(q);
    if (!bySkillTier[q.skill]) {
      bySkillTier[q.skill] = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 },
      };
    }
    bySkillTier[q.skill][tier].total += 1;
    const ok =
      Number.isInteger(a.selectedIndex) && a.selectedIndex === q.correctIndex;
    if (ok) {
      bySkill[q.skill].correct += 1;
      bySkillTier[q.skill][tier].correct += 1;
    }
  }

  const skillResults = [];
  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const [skill, row] of Object.entries(bySkill)) {
    if (row.total === 0) continue;
    const depthScore = Math.round((row.correct / row.total) * 100);
    const tierSnap = bySkillTier[skill] || {};
    skillResults.push({
      skill,
      correct: row.correct,
      totalQuestions: row.total,
      depthScore,
      depthLevel: depthLevelFromScore(depthScore),
      byDifficulty: {
        easy: tierSnap.easy || { correct: 0, total: 0 },
        medium: tierSnap.medium || { correct: 0, total: 0 },
        hard: tierSnap.hard || { correct: 0, total: 0 },
      },
    });
    totalCorrect += row.correct;
    totalQuestions += row.total;
  }

  const overallPercent =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  return {
    skillResults,
    overall: {
      correct: totalCorrect,
      totalQuestions,
      percent: overallPercent,
    },
  };
};

export const listQuizSkillIds = () => [...QUIZ_SKILL_IDS];
