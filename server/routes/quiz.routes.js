import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { consumeQuizCredits } from "../middleware/credit.middleware.js";
import {
  getQuizSkills,
  getQuizQuestions,
  submitQuiz,
  getSkillProfiles,
  getLatestQuizAttempt,
  getQuizAttemptById,
  getGlobalStats,
} from "../controllers/quiz.controllers.js";

const quizRoutes = Router();

quizRoutes.get("/skills", protectRoute, getQuizSkills);
quizRoutes.get("/stats", protectRoute, getGlobalStats);
quizRoutes.get("/profiles", protectRoute, getSkillProfiles);
quizRoutes.get("/attempts/latest", protectRoute, getLatestQuizAttempt);
quizRoutes.get("/attempts/:id", protectRoute, getQuizAttemptById);
quizRoutes.post("/questions", protectRoute, consumeQuizCredits, getQuizQuestions);
quizRoutes.post("/submit", protectRoute, submitQuiz);

export default quizRoutes;
