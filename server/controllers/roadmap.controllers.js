import Roadmap from "../models/roadmap.model.js";
import SkillProfile from "../models/skillProfile.model.js";
import User from "../models/user.model.js";
import { ROLE_REQUIRED_SKILLS } from "../services/resume.service.js";
import { ApiError, ApiResponse } from "../class/index.class.js";
import { asyncHandler } from "../utils/index.util.js";
import {
  computeRoadmapCompletion,
  generateRoadmapWithAI,
} from "../services/roadmap.service.js";
import { requireUserGeminiKey } from "../utils/userGeminiKey.js";

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

const ROADMAP_SKILLS = new Set([
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
  "javascript",
  "typescript",
  "express",
  "nextjs",
  "redux",
  "tailwind",
  "bootstrap",
  "html",
  "css",
  "mysql",
  "postgresql",
  "firebase",
  "docker",
  "aws",
  "linux",
  "c",
  "cpp",
  "php",
  "django",
  "flask",
]);

const toCanonicalSkill = (raw) => {
  const s = String(raw || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "node.js" || s === "node js") return "nodejs";
  if (s === "next.js" || s === "next js") return "nextjs";
  if (s === "mongo" || s === "mongo db") return "mongodb";
  if (s === "rest api" || s === "restful api") return "restapi";
  if (s === "system design" || s === "systems design") return "systemdesign";
  if (s === "data structures and algorithms") return "dsa";
  if (s === "postgres") return "postgresql";
  return s.replace(/\s+/g, "");
};

const getTaskXp = (task) => {
  const hours = Math.max(1, Math.min(Number(task?.estimateHours) || 2, 8));
  const difficulty = String(task?.difficulty || "medium").toLowerCase();
  const multiplier =
    difficulty === "hard" ? 1.5 : difficulty === "easy" ? 1 : 1.25;
  return Math.max(6, Math.round((6 + hours * 2) * multiplier));
};


const applyTaskProgressToSkillProfiles = async ({ userId, week, task }) => {
  const skillFocus = Array.isArray(week?.skillFocus) ? week.skillFocus : [];
  const skills = [
    ...new Set(
      skillFocus
        .map(toCanonicalSkill)
        .filter((s) => s && ROADMAP_SKILLS.has(s))
    ),
  ];

  if (skills.length === 0) return;

  const totalXp = getTaskXp(task);
  const xpPerSkill = Math.max(2, Math.round(totalXp / skills.length));
  const depthGain = Math.max(1, Math.min(8, Math.round(xpPerSkill / 3)));

  for (const skill of skills) {
    const existing = await SkillProfile.findOne({ userId, skill }).select(
      "depthScore depthLevel skillXp"
    );
    const currentScore = existing?.depthScore ?? 0;
    const nextDepthScore = Math.min(100, currentScore + depthGain);
    const nextDepthLevel =
      nextDepthScore <= 40
        ? "Beginner"
        : nextDepthScore <= 70
          ? "Intermediate"
          : "Advanced";

    await SkillProfile.findOneAndUpdate(
      { userId, skill },
      {
        $set: {
          depthScore: nextDepthScore,
          depthLevel: nextDepthLevel,
        },
        $inc: { skillXp: xpPerSkill },
      },
      { upsert: true, returnDocument: "after" }
    );
  }
};

export const generateRoadmap = asyncHandler(async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(userId).select("detectedSkills targetRole resumeText");
  if (!user || !user.targetRole) {
    throw new ApiError(400, "Target role is required in profile before generating roadmap");
  }

  const targetRole = user.targetRole;
  const totalWeeks = Math.max(2, Math.min(Number(req.body?.totalWeeks) || 8, 16));
  const targetCompanyId = req.body?.targetCompanyId
    ? String(req.body.targetCompanyId).toLowerCase().trim()
    : null;

  const roleRequiredSkills = ROLE_REQUIRED_SKILLS[targetRole] || [];
  const userGeminiKey = requireUserGeminiKey(req);

  const skillProfiles = await SkillProfile.find({ userId })
    .select("skill depthScore depthLevel")
    .lean();

  const generated = await generateRoadmapWithAI({
    totalWeeks,
    targetRole,
    targetCompanyId,
    skillProfiles,
    roleRequiredSkills,
    detectedSkills: user.detectedSkills,
    resumeText: user.resumeText,
    userApiKey: userGeminiKey,
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
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
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
    return res.status(200).json(new ApiResponse(200, "Roadmap not found", null));
  }

  const user = await User.findById(userId);
  if (user && roadmap.targetRole !== user.targetRole) {
    await Roadmap.findByIdAndDelete(roadmap._id);
    return res.status(200).json(new ApiResponse(200, "Target role changed, generating a new roadmap is required.", null));
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
  const wasDone = task.done;
  task.done = nextDone;
  task.completedAt = nextDone ? new Date() : null;

  // Award XP only once per task to prevent toggle farming.
  if (!wasDone && nextDone && !task.xpGranted) {
    await applyTaskProgressToSkillProfiles({ userId, week, task });
    task.xpGranted = true;
  }

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

  if (nextDone) {
    for (const task of week.tasks) {
      if (!task.done && !task.xpGranted) {
        await applyTaskProgressToSkillProfiles({ userId, week, task });
        task.xpGranted = true;
      }
    }
  }

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

