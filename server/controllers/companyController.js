import { createRequire } from "module";
import SkillProfile from "../models/skillProfile.model.js";

const require = createRequire(import.meta.url);
const companies = require("../data/companies.json");

const makeError = (status, message, code) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

const getReadinessLabel = (matchPercent) => {
  if (matchPercent >= 70) return "Good match";
  if (matchPercent >= 40) return "Needs work";
  return "Not ready yet";
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

const getAuthUserId = (req) =>
  req.user?.userId ?? req.user?.id ?? req.user?._id ?? null;

const buildSkillContext = async (req) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    throw makeError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const targetRole = req.user?.targetRole ?? null;
  if (!targetRole) {
    throw makeError(
      400,
      "Target role is not set for this user",
      "TARGET_ROLE_MISSING"
    );
  }

  const profiles = await SkillProfile.find({ userId })
    .select("skill depthScore")
    .lean();

  const skillMap = {};
  const takenSkills = new Set();
  for (const p of profiles) {
    const key = String(p.skill || "").toLowerCase().trim();
    if (!key) continue;
    skillMap[key] = p.depthScore ?? 0;
    takenSkills.add(key);
  }

  return { targetRole, skillMap, takenSkills };
};

const findCompanyById = (id) =>
  companies.find((company) => company.id === String(id).trim());

const overlaySkill = (row, skillMap, takenSkills) => {
  const depth = skillMap[row.skill] ?? 0;
  return {
    ...row,
    studentDepth: depth,
    quizTaken: takenSkills.has(row.skill),
    met: depth >= row.minimumDepth,
    gap: Math.max(row.minimumDepth - depth, 0),
  };
};

const buildRoleOverlay = (roleData, skillMap, takenSkills) => {
  const requiredSkills = roleData.requiredSkills.map((s) =>
    overlaySkill(s, skillMap, takenSkills)
  );
  const preferredSkills = (roleData.preferredSkills ?? []).map((s) =>
    overlaySkill(s, skillMap, takenSkills)
  );
  return { requiredSkills, preferredSkills };
};

export const getAllCompanies = async (req, res) => {
  try {
    const { targetRole, skillMap } = await buildSkillContext(req);

    const items = companies.map((company) => {
      const roleData = company.roles?.[targetRole];
      if (!roleData) {
        return {
          id: company.id,
          name: company.name,
          sector: company.sector,
          type: company.type,
          tier: company.tier,
          matchPercent: 0,
          readinessLabel: getReadinessLabel(0),
          notHiringForRole: true,
          ctc: null,
          requiredSkillCount: 0,
          studentMetCount: 0,
        };
      }

      const matchPercent = calcMatch(roleData, skillMap);
      const requiredSkillCount = roleData.requiredSkills.length;
      const studentMetCount = roleData.requiredSkills.filter(
        (row) => (skillMap[row.skill] ?? 0) >= row.minimumDepth
      ).length;

      return {
        id: company.id,
        name: company.name,
        sector: company.sector,
        type: company.type,
        tier: company.tier,
        matchPercent,
        readinessLabel: getReadinessLabel(matchPercent),
        notHiringForRole: false,
        ctc: roleData.ctc ?? null,
        requiredSkillCount,
        studentMetCount,
      };
    });

    items.sort((a, b) => b.matchPercent - a.matchPercent);
    const strongMatches = items.filter((c) => c.matchPercent >= 70).length;
    const best = items[0];

    return res.status(200).json({
      success: true,
      data: {
        companies: items,
        totalCompanies: items.length,
        strongMatches,
        bestMatch: best
          ? { id: best.id, name: best.name, matchPercent: best.matchPercent }
          : null,
      },
    });
  } catch (error) {
    console.error("GET_ALL_COMPANIES_ERROR:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message, code: error.code });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company matches",
      code: "INTERNAL_ERROR",
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = findCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
        code: "COMPANY_NOT_FOUND",
      });
    }

    const { targetRole, skillMap, takenSkills } = await buildSkillContext(req);
    const roleData = company.roles?.[targetRole];

    if (!roleData) {
      return res.status(200).json({
        success: true,
        data: {
          id: company.id,
          name: company.name,
          sector: company.sector,
          type: company.type,
          tier: company.tier,
          aboutHiring: company.aboutHiring,
          roleAvailable: false,
          message: "This company does not hire for your target role",
        },
      });
    }

    const matchPercent = calcMatch(roleData, skillMap);
    const overlay = buildRoleOverlay(roleData, skillMap, takenSkills);

    return res.status(200).json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        sector: company.sector,
        type: company.type,
        tier: company.tier,
        aboutHiring: company.aboutHiring,
        roleAvailable: true,
        ctc: roleData.ctc,
        hiringProcess: roleData.hiringProcess,
        matchPercent,
        readinessLabel: getReadinessLabel(matchPercent),
        requiredSkills: overlay.requiredSkills,
        preferredSkills: overlay.preferredSkills,
      },
    });
  } catch (error) {
    console.error("GET_COMPANY_BY_ID_ERROR:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message, code: error.code });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company details",
      code: "INTERNAL_ERROR",
    });
  }
};

export const getCompanyGap = async (req, res) => {
  try {
    const company = findCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
        code: "COMPANY_NOT_FOUND",
      });
    }

    const { targetRole, skillMap, takenSkills } = await buildSkillContext(req);
    let roleData = company.roles?.[targetRole];
    let actualRoleUsed = targetRole;

    if (!roleData) {
      // Fallback to first available role if specific one is missing
      const availableRoles = Object.keys(company.roles || {});
      if (availableRoles.length > 0) {
        actualRoleUsed = availableRoles[0];
        roleData = company.roles[actualRoleUsed];
      }
    }

    if (!roleData) {
       return res.status(400).json({
         success: false,
         message: "This company currently has no benchmark data available.",
         code: "NO_DATA_AVAILABLE",
       });
    }

    const currentMatchPercent = calcMatch(roleData, skillMap);
    const { requiredSkills } = buildRoleOverlay(roleData, skillMap, takenSkills);

    const unmetRequired = requiredSkills.filter((s) => !s.met);
    const withImpact = unmetRequired.map((s) => {
      const scoreImpact = Math.round((s.gap / s.minimumDepth) * s.weight);
      const fixedMap = { ...skillMap, [s.skill]: s.minimumDepth };
      const fixedMatchPercent = calcMatch(roleData, fixedMap);
      return {
        skill: s.skill,
        skillWeight: s.weight,
        studentDepth: s.studentDepth,
        minimumDepth: s.minimumDepth,
        depthGap: s.gap,
        scoreImpact,
        fixedMatchPercent,
        focus: s.focus,
        testedVia: s.testedVia,
        actionToFix: `Retake the ${s.skill} quiz after completing ${s.skill} roadmap tasks.`,
      };
    });

    withImpact.sort((a, b) => b.scoreImpact - a.scoreImpact);
    const topGaps = withImpact.slice(0, 3).map((g, idx) => ({
      rank: idx + 1,
      ...g,
    }));

    const allFixedMap = { ...skillMap };
    for (const reqSkill of roleData.requiredSkills) {
      if ((allFixedMap[reqSkill.skill] ?? 0) < reqSkill.minimumDepth) {
        allFixedMap[reqSkill.skill] = reqSkill.minimumDepth;
      }
    }
    const projectedMatchIfAllFixed = calcMatch(roleData, allFixedMap);

    const verdict =
      topGaps.length === 0
        ? `You meet all required skills for ${company.name}. Focus on preferred skills to stand out.`
        : `Focus on ${topGaps[0].skill} first — it has a weight of ${topGaps[0].skillWeight}% and fixing it adds ${topGaps[0].scoreImpact} points to your match score.`;

    return res.status(200).json({
      success: true,
      data: {
        company: company.name,
        companyId: company.id,
        currentMatchPercent,
        topGaps,
        projectedMatchIfAllFixed,
        verdict,
      },
    });
  } catch (error) {
    console.error("GET_COMPANY_GAP_ERROR:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message, code: error.code });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to compute company skill gaps",
      code: "INTERNAL_ERROR",
    });
  }
};

export const getAllCompanyGaps = async (req, res) => {
  try {
    const { targetRole, skillMap, takenSkills } = await buildSkillContext(req);

    const rows = companies
      .map((company) => {
        const roleData = company.roles?.[targetRole];
        if (!roleData) {
          return null;
        }

        const currentMatchPercent = calcMatch(roleData, skillMap);
        const { requiredSkills } = buildRoleOverlay(roleData, skillMap, takenSkills);
        const unmet = requiredSkills.filter((s) => !s.met);
        const totalRequiredGap = unmet.reduce((sum, s) => sum + s.gap, 0);
        const unmetRequiredCount = unmet.length;
        const metRequiredCount = requiredSkills.length - unmetRequiredCount;
        const topGap = unmet
          .slice()
          .sort((a, b) => b.gap - a.gap)[0];

        return {
          companyId: company.id,
          company: company.name,
          sector: company.sector,
          tier: company.tier,
          currentMatchPercent,
          readinessLabel: getReadinessLabel(currentMatchPercent),
          totalRequiredGap,
          unmetRequiredCount,
          metRequiredCount,
          requiredSkillCount: requiredSkills.length,
          topGap: topGap
            ? {
                skill: topGap.skill,
                depthGap: topGap.gap,
                minimumDepth: topGap.minimumDepth,
                studentDepth: topGap.studentDepth,
              }
            : null,
        };
      })
      .filter(Boolean);

    rows.sort((a, b) => {
      if (a.totalRequiredGap !== b.totalRequiredGap) {
        return a.totalRequiredGap - b.totalRequiredGap;
      }
      return b.currentMatchPercent - a.currentMatchPercent;
    });

    return res.status(200).json({
      success: true,
      data: {
        companies: rows,
        totalCompanies: rows.length,
      },
    });
  } catch (error) {
    console.error("GET_ALL_COMPANY_GAPS_ERROR:", error);
    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message, code: error.code });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company gaps",
      code: "INTERNAL_ERROR",
    });
  }
};
