import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { asyncHandler } from "../utils/index.util.js";
import { ApiResponse } from "../class/index.class.js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { generateInterviewQuestions, evaluateAnswer } from "../services/interview.service.js";
import { checkDailyCredits, consumeCredits } from "../middleware/credit.middleware.js";

router.get("/", protectRoute, checkDailyCredits, consumeCredits(5), asyncHandler(async (req, res) => {
  // Existing GET logic...
  const { topic } = req.query; 
  const defaultRole = req.user?.targetRole || "frontend";
  const rawTopic = (topic || defaultRole).toLowerCase().trim();

  const topicMap = {
    "c++": "cpp",
    "node.js": "node.js",
    "javascript": "js",
    "mongodb": "mongo",
    "spring boot": "springboot",
    "system design": "systemdesign",
  };

  const usedTopic = topicMap[rawTopic] || rawTopic;

  try {
    const data = await generateInterviewQuestions(usedTopic);
    return res.status(200).json(
      new ApiResponse(200, "Interview questions generated successfully", data)
    );
  } catch (error) {
    console.error("Interview Route Error (AI Failed):", error.message);
    const p = path.join(__dirname, "../data/interviews.json");
    const bank = JSON.parse(readFileSync(p, "utf8"));
    let questions = bank[usedTopic] || bank[rawTopic] || bank["frontend"];
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
    return res.status(200).json(
      new ApiResponse(200, "Interview questions fetched from bank (fallback)", { questions: shuffled })
    );
  }
}));

router.post("/evaluate", protectRoute, asyncHandler(async (req, res) => {
  const { question, answer, ideal } = req.body;
  
  if (!question || !ideal) {
    return res.status(400).json(new ApiResponse(400, "Missing question or ideal answer"));
  }

  const evaluation = await evaluateAnswer(question, answer, ideal);
  
  return res.status(200).json(
    new ApiResponse(200, "Answer evaluated successfully", evaluation)
  );
}));

export default router;
