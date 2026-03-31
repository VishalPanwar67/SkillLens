import CustomTarget from "../models/customTarget.model.js";
import SkillProfile from "../models/skillProfile.model.js";

const makeError = (status, message, code) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

const calcMatch = (roleData, skillMap) => {
  const reqScore = roleData.requiredSkills.reduce((sum, req) => {
    const depth = skillMap[req.skill] ?? 0;
    const ratio = Math.min(depth / req.minimumDepth, 1.0);
    return sum + ratio * req.weight;
  }, 0);

  const prefScore = (roleData.preferredSkills ?? []).reduce((sum, pref) => {
    const depth = skillMap[pref.skill];
    if (depth === undefined) return sum;
    const ratio = Math.min(depth / pref.minimumDepth, 1.0);
    return sum + ratio * pref.weight;
  }, 0);

  return Math.round(reqScore + prefScore);
};

export const createCustomTarget = async (req, res) => {
  try {
    const { companyName, roleTitle, sector, about, hiringProcess, requiredSkills, preferredSkills } = req.body;
    const userId = req.user._id;

    if (!companyName || !roleTitle || !requiredSkills) {
      throw makeError(400, "Missing required fields", "INVALID_INPUT");
    }

    const target = await CustomTarget.create({
      userId,
      companyName,
      roleTitle,
      sector,
      about,
      hiringProcess,
      requiredSkills,
      preferredSkills,
    });

    return res.status(201).json({
      success: true,
      data: target,
      message: "Custom hiring target benchmarked successfuly.",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Server error", code: "INTERNAL_ERROR" });
  }
};

export const getCustomTargets = async (req, res) => {
  try {
    const userId = req.user._id;
    const targets = await CustomTarget.find({ userId }).lean();

    const profiles = await SkillProfile.find({ userId }).lean();
    const skillMap = {};
    for (const p of profiles) {
      skillMap[p.skill.toLowerCase().trim()] = p.depthScore ?? 0;
    }

    const formatted = targets.map((t) => {
      const matchPercent = calcMatch(t, skillMap);
      return {
        ...t,
        matchPercent,
        currentMatchPercent: matchPercent,
        isCustom: true,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching custom targets" });
  }
};

export const deleteCustomTarget = async (req, res) => {
    try {
      const target = await CustomTarget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
      if (!target) throw makeError(404, "Target not found", "NOT_FOUND");
      return res.status(200).json({ success: true, message: "Target removed." });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
