import Roadmap from "../models/roadmap.model.js";
import SkillProfile from "../models/skillProfile.model.js";
import { ApiError, ApiResponse } from "../class/index.class.js";
import { asyncHandler } from "../utils/index.util.js";
import {
  computeRoadmapCompletion,
  generateRoadmapWithAI,
} from "../services/roadmap.service.js";

const getAuthUserId = (req) =>
  req.user?.userId ?? req.user?.id ?? req.user?._id ?? null;

const serializeRoadmap = (doc) => ({
  id: doc._id,
  title: doc.title,
  targetRole: doc.targetRole,
  targetCompanyId: doc.targetCompanyId,
  targetCompanyName: doc.targetCompanyName,
  totalWeeks: doc.totalWeeks,
  completionPercent: doc.completionPercent,
  source: doc.source,
  weeks: doc.weeks,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const generateRoadmap = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const targetRole = req.user?.targetRole;
  if (!targetRole) {
    throw new ApiError(400, "Target role is required before generating roadmap");
  }

  const totalWeeks = Math.max(2, Math.min(Number(req.body?.totalWeeks) || 8, 16));
  const targetCompanyId = req.body?.targetCompanyId
    ? String(req.body.targetCompanyId).toLowerCase().trim()
    : null;

  const skillProfiles = await SkillProfile.find({ userId })
    .select("skill depthScore depthLevel")
    .lean();

  const generated = await generateRoadmapWithAI({
    totalWeeks,
    targetRole,
    targetCompanyId,
    skillProfiles,
  });

  const completionPercent = computeRoadmapCompletion(generated.weeks);

  const roadmap = await Roadmap.findOneAndUpdate(
    { userId },
    {
      $set: {
        title: generated.title,
        targetRole,
        targetCompanyId,
        targetCompanyName: generated.title.includes(" for ")
          ? generated.title.split(" for ").slice(1).join(" for ")
          : null,
        totalWeeks,
        completionPercent,
        weeks: generated.weeks,
        source: generated.source,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Roadmap generated", serializeRoadmap(roadmap)));
});

export const getRoadmap = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const roadmap = await Roadmap.findOne({ userId });
  if (!roadmap) {
    throw new ApiError(404, "Roadmap not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Roadmap fetched", serializeRoadmap(roadmap)));
});

export const toggleRoadmapTask = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const weekNumber = Number(req.params.weekNumber);
  const taskId = String(req.params.taskId || "").trim();
  if (!Number.isFinite(weekNumber) || weekNumber < 1 || !taskId) {
    throw new ApiError(400, "Invalid week number or task id");
  }

  const roadmap = await Roadmap.findOne({ userId });
  if (!roadmap) {
    throw new ApiError(404, "Roadmap not found");
  }

  const week = roadmap.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) {
    throw new ApiError(404, "Week not found");
  }

  const task = week.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const bodyDone = req.body?.done;
  const nextDone = typeof bodyDone === "boolean" ? bodyDone : !task.done;
  task.done = nextDone;
  task.completedAt = nextDone ? new Date() : null;

  week.done = week.tasks.length > 0 && week.tasks.every((t) => t.done);
  week.completedAt = week.done ? new Date() : null;

  roadmap.completionPercent = computeRoadmapCompletion(roadmap.weeks);
  await roadmap.save();

  return res.status(200).json(
    new ApiResponse(200, "Roadmap task updated", {
      completionPercent: roadmap.completionPercent,
      week,
      task,
      roadmapId: roadmap._id,
    })
  );
});

export const toggleRoadmapWeek = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const weekNumber = Number(req.params.weekNumber);
  if (!Number.isFinite(weekNumber) || weekNumber < 1) {
    throw new ApiError(400, "Invalid week number");
  }

  const roadmap = await Roadmap.findOne({ userId });
  if (!roadmap) {
    throw new ApiError(404, "Roadmap not found");
  }

  const week = roadmap.weeks.find((w) => w.weekNumber === weekNumber);
  if (!week) {
    throw new ApiError(404, "Week not found");
  }

  const bodyDone = req.body?.done;
  const nextDone = typeof bodyDone === "boolean" ? bodyDone : !week.done;

  week.done = nextDone;
  week.completedAt = nextDone ? new Date() : null;
  for (const task of week.tasks) {
    task.done = nextDone;
    task.completedAt = nextDone ? new Date() : null;
  }

  roadmap.completionPercent = computeRoadmapCompletion(roadmap.weeks);
  await roadmap.save();

  return res.status(200).json(
    new ApiResponse(200, "Roadmap week updated", {
      completionPercent: roadmap.completionPercent,
      week,
      roadmapId: roadmap._id,
    })
  );
});

