import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { asyncHandler } from "../utils/index.util.js";
import { ApiResponse } from "../class/index.class.js";

const router = Router();

import {
  getInterviewQuestionsFromBank,
  evaluateAnswer,
} from "../services/interview.service.js";
import {
  checkDailyCredits,
  consumeCredits,
} from "../middleware/credit.middleware.js";

router.get(
  "/",
  protectRoute,
  checkDailyCredits,
  consumeCredits(5),
  asyncHandler(async (req, res) => {
    const { topic } = req.query;
    const defaultRole = req.user?.targetRole || "frontend";
    const rawTopic = (topic || defaultRole).toLowerCase().trim();

    const topicMap = {
      "c++": "cpp",
      "node.js": "node.js",
      javascript: "js",
      mongodb: "mongo",
      "spring boot": "springboot",
      "system design": "systemdesign",
    };

    const usedTopic = topicMap[rawTopic] || rawTopic;

    const data = getInterviewQuestionsFromBank(usedTopic, rawTopic);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Interview questions loaded from question bank",
          data
        )
      );
  })
);

router.post(
  "/evaluate",
  protectRoute,
  asyncHandler(async (req, res) => {
    const { question, answer, ideal } = req.body;

    if (!question || !ideal) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Missing question or ideal answer"));
    }

    const evaluation = await evaluateAnswer(question, answer, ideal);

    return res
      .status(200)
      .json(new ApiResponse(200, "Answer evaluated successfully", evaluation));
  })
);

export default router;
