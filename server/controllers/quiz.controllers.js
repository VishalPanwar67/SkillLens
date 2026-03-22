import { asyncHandler } from "../utils/index.util.js";
import { ApiError, ApiResponse } from "../class/index.class.js";
import User from "../models/user.model.js";
import SkillProfile from "../models/skillProfile.model.js";
import mongoose from "mongoose";
import {
  buildQuizSession,
  gradeQuiz,
  buildQuestionReviews,
  listQuizSkillIds,
} from "../services/quiz.service.js";
import { isQuizSkill, formatQuizTitle } from "../constants/quizSkills.js";
import QuizAttempt from "../models/quizAttempt.model.js";

export const getQuizSkills = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Quiz skills", {
      skills: listQuizSkillIds(),
    })
  );
});

export const getQuizQuestions = asyncHandler(async (req, res) => {
  let skills = req.body?.skills;

  if (Array.isArray(skills) && skills.length > 0) {
    skills = [
      ...new Set(
        skills.map((s) => String(s).toLowerCase().trim()).filter(isQuizSkill)
      ),
    ];
    if (skills.length === 0) {
      throw new ApiError(
        400,
        "None of the requested skills have a quiz. See GET /api/quiz/skills"
      );
    }
  } else {
    const user = await User.findById(req.user.id).select("detectedSkills");
    const detected = user?.detectedSkills || [];
    skills = detected.filter((s) => isQuizSkill(s));
  }

  if (skills.length === 0) {
    throw new ApiError(
      400,
      "No skills for quiz — upload a resume or pass skills: [\"react\",\"nodejs\", ...]"
    );
  }

  try {
    const session = buildQuizSession(skills);
    return res.status(200).json(
      new ApiResponse(200, "Quiz questions", {
        questions: session.questions,
        totalQuestions: session.totalQuestions,
        skills: session.skills,
        questionsPerSkill: session.questionsPerSkill,
        difficultyMixPerSkill: session.difficultyMix,
      })
    );
  } catch (e) {
    if (e.message === "NO_QUIZ_SKILLS") {
      throw new ApiError(400, "No valid quiz skills in the request");
    }
    if (e.message?.startsWith("INSUFFICIENT_QUESTIONS")) {
      throw new ApiError(500, "Question bank incomplete for a skill");
    }
    throw e;
  }
});

export const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ApiError(400, "answers array is required");
  }

  let timeSpentSeconds = req.body.timeSpentSeconds;
  if (timeSpentSeconds !== undefined && timeSpentSeconds !== null) {
    const t = Number(timeSpentSeconds);
    if (!Number.isFinite(t) || t < 0 || t > 86400) {
      throw new ApiError(
        400,
        "timeSpentSeconds must be a number from 0 to 86400 (seconds)"
      );
    }
    timeSpentSeconds = Math.round(t);
  } else {
    timeSpentSeconds = null;
  }

  const questionReviews = buildQuestionReviews(answers);
  if (questionReviews.length === 0) {
    throw new ApiError(
      400,
      "No valid answers — questionId values must match the issued quiz"
    );
  }

  const graded = gradeQuiz(answers);
  if (graded.skillResults.length === 0) {
    throw new ApiError(
      400,
      "No valid answers — questionId values must match the issued quiz"
    );
  }

  const userId = req.user.id;
  const skillResultsWithPrev = [];

  for (const r of graded.skillResults) {
    const prev = await SkillProfile.findOne({
      userId,
      skill: r.skill,
    }).select("depthScore");

    await SkillProfile.findOneAndUpdate(
      { userId, skill: r.skill },
      {
        $set: {
          depthScore: r.depthScore,
          depthLevel: r.depthLevel,
          lastAttempt: new Date(),
        },
        $inc: { quizAttempts: 1 },
      },
      { upsert: true, new: true }
    );

    skillResultsWithPrev.push({
      ...r,
      previousDepthScore:
        prev && typeof prev.depthScore === "number" ? prev.depthScore : null,
    });
  }

  const skillsOrdered = graded.skillResults.map((r) => r.skill);
  const title = formatQuizTitle(skillsOrdered);

  const attempt = await QuizAttempt.create({
    userId,
    title,
    skills: skillsOrdered,
    overallPercent: graded.overall.percent,
    totalCorrect: graded.overall.correct,
    totalQuestions: graded.overall.totalQuestions,
    timeSpentSeconds,
    skillResults: skillResultsWithPrev,
    questionReviews,
  });

  return res.status(200).json(
    new ApiResponse(200, "Quiz graded", {
      attemptId: attempt._id,
      title,
      timeSpentSeconds,
      questionReviews,
      skillResults: skillResultsWithPrev,
      overall: graded.overall,
    })
  );
});

const serializeAttempt = (doc) => ({
  attemptId: doc._id,
  title: doc.title,
  skills: doc.skills,
  overallPercent: doc.overallPercent,
  totalCorrect: doc.totalCorrect,
  totalQuestions: doc.totalQuestions,
  timeSpentSeconds: doc.timeSpentSeconds,
  skillResults: doc.skillResults,
  questionReviews: doc.questionReviews,
  createdAt: doc.createdAt,
});

/** Reload the Quiz Results page after refresh — latest attempt for this user. */
export const getLatestQuizAttempt = asyncHandler(async (req, res) => {
  const doc = await QuizAttempt.findOne({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  if (!doc) {
    throw new ApiError(404, "No quiz attempts yet");
  }

  return res.status(200).json(
    new ApiResponse(200, "Latest quiz attempt", serializeAttempt(doc))
  );
});

/** Fetch one saved result by id (same shape as submit / latest). */
export const getQuizAttemptById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid attempt id");
  }

  const doc = await QuizAttempt.findOne({
    _id: id,
    userId: req.user.id,
  });

  if (!doc) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Quiz attempt", serializeAttempt(doc)));
});

export const getSkillProfiles = asyncHandler(async (req, res) => {
  const profiles = await SkillProfile.find({ userId: req.user.id }).sort({
    skill: 1,
  });
  return res.status(200).json(
    new ApiResponse(200, "Skill profiles", { profiles })
  );
});
