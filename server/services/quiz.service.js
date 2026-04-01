import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  QUIZ_SKILL_IDS,
  QUESTIONS_PER_SKILL,
  DIFFICULTY_MIX,
  isQuizSkill,
  parseTierQuizSkill,
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

/**
 * Picks `count` questions preferring one difficulty tier, then spilling into
 * related tiers so we always reach 10 even if the bank has <10 in that tier.
 */
export const pickTierQuestions = (pool, primaryTier, count = QUESTIONS_PER_SKILL) => {
  if (!pool?.length) return null;

  const fallbackOrder =
    primaryTier === "easy"
      ? ["easy", "medium", "hard"]
      : primaryTier === "medium"
        ? ["medium", "easy", "hard"]
        : ["hard", "medium", "easy"];

  const picked = [];
  const used = new Set();

  for (const tier of fallbackOrder) {
    const bucket = shuffle(
      pool.filter((q) => normalizeDifficulty(q) === tier && !used.has(q.id))
    );
    for (const q of bucket) {
      if (picked.length >= count) break;
      picked.push(q);
      used.add(q.id);
    }
    if (picked.length >= count) break;
  }

  if (picked.length < count) return null;
  return shuffle(picked.slice(0, count));
};

export const depthLevelFromScore = (score) => {
  if (score <= 40) return "Beginner";
  if (score <= 70) return "Intermediate";
  return "Advanced";
};

/** Find a question anywhere in questions.json (ids are unique per project). */
export const findQuestionInBank = (questionId) => {
  const bank = loadBank();
  const id = String(questionId || "");
  for (const key of Object.keys(bank)) {
    const list = bank[key];
    if (!Array.isArray(list)) continue;
    const q = list.find((x) => x.id === id);
    if (q) {
      return { ...q, bankKey: key };
    }
  }
  return null;
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
    const tierInfo = parseTierQuizSkill(skill);

    if (tierInfo) {
      const pool = bank[tierInfo.base];
      if (!Array.isArray(pool) || pool.length === 0) {
        throw new Error(`INSUFFICIENT_QUESTIONS:${skill}`);
      }
      const picked = pickTierQuestions(pool, tierInfo.difficulty, QUESTIONS_PER_SKILL);
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
      continue;
    }

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

  const singleTier = unique.length === 1 ? parseTierQuizSkill(unique[0]) : null;
  const difficultyMix = singleTier
    ? {
        easy: singleTier.difficulty === "easy" ? QUESTIONS_PER_SKILL : 0,
        medium: singleTier.difficulty === "medium" ? QUESTIONS_PER_SKILL : 0,
        hard: singleTier.difficulty === "hard" ? QUESTIONS_PER_SKILL : 0,
      }
    : { ...DIFFICULTY_MIX };

  return {
    questions: shuffled,
    totalQuestions: shuffled.length,
    skills: unique,
    questionsPerSkill: QUESTIONS_PER_SKILL,
    difficultyMix,
  };
};

/** Per-question rows for the results UI (correct / incorrect, text, indices). */
export const buildQuestionReviews = (answers, sessionSkills) => {
  const singleSessionSkill =
    Array.isArray(sessionSkills) && sessionSkills.length === 1
      ? sessionSkills[0]
      : null;
  const tierMeta = singleSessionSkill
    ? parseTierQuizSkill(singleSessionSkill)
    : null;

  const reviews = [];
  for (const a of answers) {
    const q = findQuestionInBank(a.questionId);
    if (!q) continue;

    if (tierMeta && q.bankKey !== tierMeta.base) continue;

    const selectedIndex = Number.isInteger(a.selectedIndex)
      ? a.selectedIndex
      : -1;
    const isCorrect = selectedIndex === q.correctIndex;
    const displaySkill = singleSessionSkill || q.bankKey;
    reviews.push({
      questionId: q.id,
      question: q.question,
      skill: displaySkill,
      difficulty: normalizeDifficulty(q),
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
    });
  }
  return reviews;
};

export const gradeQuiz = (answers, sessionSkills) => {
  const targetSkill =
    Array.isArray(sessionSkills) && sessionSkills.length === 1
      ? sessionSkills[0]
      : null;
  const tierInfo = targetSkill ? parseTierQuizSkill(targetSkill) : null;

  const bySkill = {};
  const bySkillTier = {};

  for (const a of answers) {
    const q = findQuestionInBank(a.questionId);
    if (!q) continue;

    if (tierInfo && q.bankKey !== tierInfo.base) continue;

    const skillKey = targetSkill || q.bankKey;
    if (!bySkill[skillKey]) bySkill[skillKey] = { correct: 0, total: 0 };
    bySkill[skillKey].total += 1;

    const diff = normalizeDifficulty(q);
    if (!bySkillTier[skillKey]) {
      bySkillTier[skillKey] = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 },
      };
    }
    bySkillTier[skillKey][diff].total += 1;

    const ok =
      Number.isInteger(a.selectedIndex) && a.selectedIndex === q.correctIndex;
    if (ok) {
      bySkill[skillKey].correct += 1;
      bySkillTier[skillKey][diff].correct += 1;
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
