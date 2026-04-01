import { asyncHandler } from "../utils/index.util.js";
import { ApiError, ApiResponse } from "../class/index.class.js";
import { extractText, detectSkills } from "../services/resume.service.js";
import User from "../models/user.model.js";
import SkillProfile from "../models/skillProfile.model.js";

const ALLOWED_ROLES = ["frontend", "backend", "fullstack", "data", "java"];
const RESUME_BASELINE_DEPTH = 30;

const depthLevelFromScore = (score) => {
  if (score <= 40) return "Beginner";
  if (score <= 70) return "Intermediate";
  return "Advanced";
};

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    throw new ApiError(
      400,
      "No PDF file uploaded. Send one PDF (field name e.g. resume, file, or pdf) and set targetRole as text, not file"
    );
  }

  let targetRole = req.body?.targetRole?.trim() || req.user?.targetRole;

  if (!targetRole) {
    throw new ApiError(
      400,
      "targetRole is required — set it in profile or send it in the form"
    );
  }

  if (!ALLOWED_ROLES.includes(targetRole)) {
    throw new ApiError(400, "Invalid target role");
  }

  let text;
  try {
    text = await extractText(req.file.buffer);
  } catch (error) {
    throw new ApiError(
      400,
      `Could not read this PDF: ${error.message || "Unknown error"}. Ensure it is not image-only.`
    );
  }

  const analysis = detectSkills(text, targetRole);

  // Keep company-gap inputs in sync with latest resume.
  // Company readiness reads SkillProfile.depthScore, not only detectedSkills.
  const requiredSkills = analysis.roleRequiredSkills || [];
  const detectedSet = new Set(analysis.detectedSkills || []);

  const existing = await SkillProfile.find({
    userId: req.user.id,
    skill: { $in: requiredSkills },
  }).select("skill quizAttempts skillXp");

  const bySkill = new Map(existing.map((p) => [p.skill, p]));
  for (const skill of requiredSkills) {
    const hasDetected = detectedSet.has(skill);
    const prev = bySkill.get(skill);

    // If skill already has quiz/xp evidence, do not overwrite user progress.
    const hasStrongEvidence =
      (prev?.quizAttempts || 0) > 0 || (prev?.skillXp || 0) > 0;
    if (hasStrongEvidence) continue;

    const nextDepth = hasDetected ? RESUME_BASELINE_DEPTH : 0;
    await SkillProfile.findOneAndUpdate(
      { userId: req.user.id, skill },
      {
        $set: {
          depthScore: nextDepth,
          depthLevel: depthLevelFromScore(nextDepth),
        },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  await User.findByIdAndUpdate(req.user.id, {
    targetRole: targetRole,
    detectedSkills: analysis.detectedSkills,
    resumeText: text,
    lastResumeScore: analysis.coveragePercent,
    $push: { readinessHistory: { score: analysis.coveragePercent } }
  });

  return res.status(200).json(
    new ApiResponse(200, "Resume analyzed successfully", {
      targetRole,
      ...analysis,
    })
  );
});

export const analyzeCurrent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");
  
  if (!user.resumeText || !user.targetRole) {
    return res.status(200).json(new ApiResponse(200, "Incomplete profile", { missingSkills: [] }));
  }

  const analysis = detectSkills(user.resumeText, user.targetRole);
  return res.status(200).json(new ApiResponse(200, "Current analysis fetched", analysis));
});
