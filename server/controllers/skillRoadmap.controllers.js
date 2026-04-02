import SkillRoadmap from "../models/skillRoadmap.model.js";
import { generateSkillRoadmap, getDailyStudyPlan } from "../services/skillRoadmap.service.js";
import { generateGeminiText, hasGeminiApiKey } from "../services/gemini.service.js";
import { asyncHandler } from "../utils/index.util.js";
import { ApiError, ApiResponse } from "../class/index.class.js";

export const getSkillRoadmap = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { skill, refresh } = req.query;

  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  let roadmap = await SkillRoadmap.findOne({ userId, skill: skill.toLowerCase() });

  if (!roadmap || refresh === "true" || 
      (roadmap.steps && roadmap.steps.length <= 1) || 
      (roadmap.projects && roadmap.projects.length < 3) || 
      (roadmap.questions && roadmap.questions.length < 4) ||
      (!roadmap.videos || roadmap.videos.length === 0)) {
    // Re-generate if videos are missing or data is incomplete
    roadmap = await generateSkillRoadmap(userId, skill);
  }

  return res.status(200).json(new ApiResponse(200, "Roadmap fetched", roadmap));
});

export const toggleTaskProgress = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { skill, stepId, done } = req.body;

  const roadmap = await SkillRoadmap.findOne({ userId, skill: skill.toLowerCase() });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");

  const step = roadmap.steps.find((s) => s.id === stepId);
  if (step) {
    step.done = done;
  }

  // Recalculate overall progress
  const total = roadmap.steps.length;
  const completed = roadmap.steps.filter((s) => s.done).length;
  roadmap.overallProgress = Math.round((completed / total) * 100);

  await roadmap.save();
  return res.status(200).json(new ApiResponse(200, "Progress updated", roadmap));
});

export const toggleProjectStatus = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const { skill, projectId, done } = req.body;

  const roadmap = await SkillRoadmap.findOne({ userId, skill: skill.toLowerCase() });
  if (!roadmap) throw new ApiError(404, "Roadmap not found");

  const project = roadmap.projects.find((p) => p.id === projectId);
  if (project) {
    project.done = done;
  }

  await roadmap.save();
  return res.status(200).json(new ApiResponse(200, "Project status updated", roadmap));
});

export const generateDailyPlan = asyncHandler(async (req, res) => {
  const { skill, days } = req.body;
  if (!skill || !days) {
    throw new ApiError(400, "Skill and days are required");
  }

  const plan = await getDailyStudyPlan(skill, days);
  return res.status(200).json(new ApiResponse(200, "Daily plan generated", plan));
});

export const handleMockInterview = asyncHandler(async (req, res) => {
  const { skill, userMessage, chatHistory } = req.body;

  if (!skill || !userMessage) {
    throw new ApiError(400, "Skill and user message are required");
  }

  const systemInstruction = `You are an AI Interviewer for a candidate applying for a position requiring ${skill} skills.
  Context: ${skill} interview.
  Recent history: ${JSON.stringify(chatHistory || [])}
  User said: "${userMessage}"
  
  Rule: Be professional, ask exactly one follow-up technical question if they answered, or provide feedback if they asked for it. 
  Keep responses short and focused on ${skill} concepts.`;

  try {
    let aiResponse = "";

    if (hasGeminiApiKey()) {
      aiResponse = await generateGeminiText({
        systemInstruction,
        prompt: userMessage,
        temperature: 0.7,
      });
    } else {
      aiResponse =
        "I'm currently in manual mode. Set GEMINI_API_KEY in server/config/.env for AI responses.";
    }

    if (!aiResponse) {
      aiResponse = "Interesting. Let's move on to the next topic.";
    }

    return res.status(200).json(new ApiResponse(200, "AI responded", aiResponse));
  } catch (error) {
    throw new ApiError(500, "Mock interview failed: " + error.message);
  }
});
