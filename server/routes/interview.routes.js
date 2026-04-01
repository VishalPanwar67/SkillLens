import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { asyncHandler } from "../utils/index.util.js";
import { ApiResponse } from "../class/index.class.js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { generateInterviewQuestions } from "../services/interview.service.js";

router.get("/", protectRoute, asyncHandler(async (req, res) => {
  const { topic } = req.query; // Get topic from query params
  const defaultRole = req.user?.targetRole || "frontend";
  const rawTopic = (topic || defaultRole).toLowerCase().trim();

  // Map UI names to JSON bank keys
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
    
    // Fallback to local data
    const p = path.join(__dirname, "../data/interviews.json");
    const bank = JSON.parse(readFileSync(p, "utf8"));
    
    // Attempt lookup with mapping or direct key
    let questions = bank[usedTopic] || bank[rawTopic] || bank["frontend"];
    
    // Randomize and slice
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
    
    return res.status(200).json(
      new ApiResponse(200, "Interview questions fetched from bank (fallback)", { questions: shuffled })
    );
  }
}));

export default router;
