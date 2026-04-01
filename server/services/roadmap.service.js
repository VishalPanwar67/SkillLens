import { createRequire } from "module";

const require = createRequire(import.meta.url);
const companies = require("../data/companies.json");

const SKILL_LABELS = {
  react: "React",
  nodejs: "Node.js",
  mongodb: "MongoDB",
  sql: "SQL",
  python: "Python",
  java: "Java",
  dsa: "DSA",
  restapi: "REST APIs",
  systemdesign: "System Design",
  git: "Git",
};

const toLabel = (skill) => SKILL_LABELS[skill] || skill;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const calcCompanyMatchPercent = (roleData, depthMap) => {
  const reqScore = (roleData?.requiredSkills || []).reduce((sum, req) => {
    const depth = depthMap[req.skill] ?? 0;
    const ratio = Math.min(depth / req.minimumDepth, 1);
    return sum + ratio * (req.weight || 0);
  }, 0);

  const prefScore = (roleData?.preferredSkills || []).reduce((sum, pref) => {
    const depth = depthMap[pref.skill];
    if (depth === undefined) return sum;
    const ratio = Math.min(depth / pref.minimumDepth, 1);
    return sum + ratio * (pref.weight || 0);
  }, 0);

  return Math.round(reqScore + prefScore);
};

const buildDepthMap = (skillProfiles = []) => {
  const map = {};
  for (const s of skillProfiles) {
    map[String(s.skill || "").toLowerCase().trim()] = s.depthScore ?? 0;
  }
  return map;
};

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }
    throw new Error("ROADMAP_JSON_PARSE_FAILED");
  }
};

const getCompanyById = (companyId) =>
  companies.find((c) => c.id === String(companyId || "").toLowerCase().trim());

const normalizeRoadmapOutput = (raw, totalWeeks) => {
  if (!raw || !Array.isArray(raw.weeks)) {
    throw new Error("ROADMAP_INVALID_SHAPE");
  }

  const weeks = raw.weeks.slice(0, totalWeeks).map((w, i) => {
    const tasks = Array.isArray(w.tasks) ? w.tasks : [];
    return {
      weekNumber: i + 1,
      theme: String(w.theme || `Week ${i + 1} Focus`).trim(),
      goal: String(w.goal || "Improve skill depth and readiness").trim(),
      skillFocus: Array.isArray(w.skillFocus)
        ? w.skillFocus.map((s) => String(s).toLowerCase().trim()).filter(Boolean)
        : [],
      tasks: tasks.slice(0, 5).map((t, j) => ({
        id: `w${i + 1}_t${j + 1}`,
        title: String(t.title || `Task ${j + 1}`).trim(),
        description: String(t.description || "Practice this topic with hands-on work.").trim(),
        why: String(t.why || "This closes an important skill gap.").trim(),
        deliverable: String(t.deliverable || "A concrete output demonstrating completion.").trim(),
        estimateHours: clamp(Number(t.estimateHours) || 2, 1, 8),
        difficulty: ["easy", "medium", "hard"].includes(String(t.difficulty).toLowerCase())
          ? String(t.difficulty).toLowerCase()
          : "medium",
        done: false,
        completedAt: null,
      })),
      done: false,
      completedAt: null,
    };
  });

  while (weeks.length < totalWeeks) {
    const n = weeks.length + 1;
    weeks.push({
      weekNumber: n,
      theme: `Week ${n} Progress`,
      goal: "Continue improving weak skills and retest quiz depth.",
      skillFocus: [],
      tasks: [
        {
          id: `w${n}_t1`,
          title: "Practice and revise",
          description: "Spend focused time practicing unresolved weak areas from previous weeks.",
          why: "Consistency improves retention and quiz performance.",
          deliverable: "A short revision log with completed practice items.",
          estimateHours: 2,
          difficulty: "easy",
          done: false,
          completedAt: null,
        },
      ],
      done: false,
      completedAt: null,
    });
  }

  return {
    title: String(raw.title || `${totalWeeks}-week placement roadmap`).trim(),
    weeks,
  };
};

const buildFallbackRoadmap = ({
  totalWeeks,
  targetRole,
  companyName,
  prioritizedSkills,
}) => {
  const skills = prioritizedSkills.length
    ? prioritizedSkills
    : ["dsa", "nodejs", "mongodb", "restapi", "systemdesign"];

  const weeks = Array.from({ length: totalWeeks }, (_, idx) => {
    const primary = skills[idx % skills.length];
    const next = skills[(idx + 1) % skills.length];
    const n = idx + 1;
    return {
      weekNumber: n,
      theme: `${toLabel(primary)} practical sprint`,
      goal: `Increase ${toLabel(primary)} confidence and measurable output this week.`,
      skillFocus: [primary, next].filter(Boolean),
      tasks: [
        {
          id: `w${n}_t1`,
          title: `Core practice: ${toLabel(primary)}`,
          description: `Do focused problem-solving and concept revision for ${toLabel(primary)}. Keep short notes for mistakes and fixes.`,
          why: `This skill directly impacts your ${targetRole} readiness.`,
          deliverable: `A completed practice log for ${toLabel(primary)} with at least 12 solved items.`,
          estimateHours: 3,
          difficulty: "medium",
          done: false,
          completedAt: null,
        },
        {
          id: `w${n}_t2`,
          title: `Build mini implementation with ${toLabel(primary)}`,
          description: `Create a small implementation task to apply ${toLabel(primary)} in realistic conditions.`,
          why: "Hands-on implementation improves depth more than passive study.",
          deliverable: "A runnable code artifact committed locally with a short README note.",
          estimateHours: 4,
          difficulty: "hard",
          done: false,
          completedAt: null,
        },
        {
          id: `w${n}_t3`,
          title: `Checkpoint retest for ${toLabel(primary)}`,
          description: `Retake the ${toLabel(primary)} quiz and compare score against your previous attempt.`,
          why: "Quantified checkpoints confirm whether learning is effective.",
          deliverable: `Updated ${toLabel(primary)} depth score and one-paragraph reflection.`,
          estimateHours: 2,
          difficulty: "easy",
          done: false,
          completedAt: null,
        },
      ],
      done: false,
      completedAt: null,
    };
  });

  return {
    title: companyName
      ? `${totalWeeks}-week ${targetRole} roadmap for ${companyName}`
      : `${totalWeeks}-week ${targetRole} placement roadmap`,
    weeks,
  };
};

const buildMasteryRoadmap = ({
  totalWeeks,
  targetRole,
  companyName,
  targetRoleData,
  skillProfiles,
}) => {
  const depthMap = buildDepthMap(skillProfiles);
  const preferred = (targetRoleData?.preferredSkills || [])
    .map((p) => ({
      skill: p.skill,
      gap: Math.max((p.minimumDepth || 0) - (depthMap[p.skill] || 0), 0),
    }))
    .sort((a, b) => b.gap - a.gap)
    .map((x) => x.skill);

  const advancedDefaults = ["systemdesign", "dsa", "restapi", "git"];
  const focusPool = [...new Set([...preferred, ...advancedDefaults])].filter(
    Boolean
  );

  const weeks = Array.from({ length: totalWeeks }, (_, idx) => {
    const primary = focusPool[idx % focusPool.length] || "systemdesign";
    const secondary =
      focusPool[(idx + 1) % focusPool.length] || "dsa";
    const n = idx + 1;

    return {
      weekNumber: n,
      theme: `${toLabel(primary)} mastery sprint`,
      goal: `Convert readiness into interview-winning execution for ${toLabel(primary)}.`,
      skillFocus: [primary, secondary],
      tasks: [
        {
          id: `w${n}_t1`,
          title: `Advanced drill: ${toLabel(primary)}`,
          description:
            `Solve advanced, company-style scenarios in ${toLabel(primary)}. ` +
            "Prioritize quality, speed, and edge-case handling.",
          why: "At 100% readiness, consistency at higher difficulty is the differentiator.",
          deliverable:
            "A reviewed set of solutions with notes on trade-offs and optimization decisions.",
          estimateHours: 3,
          difficulty: "hard",
          done: false,
          completedAt: null,
        },
        {
          id: `w${n}_t2`,
          title: "Interview simulation checkpoint",
          description:
            "Run one timed mock round (technical + discussion) and record weak communication or reasoning points.",
          why: "Selection depends on interview performance beyond raw skill thresholds.",
          deliverable:
            "Mock interview summary with top 3 improvements for next sprint.",
          estimateHours: 2,
          difficulty: "medium",
          done: false,
          completedAt: null,
        },
        {
          id: `w${n}_t3`,
          title: `Retest + polish: ${toLabel(primary)}`,
          description:
            `Retake quiz/checkpoint for ${toLabel(primary)} and polish one portfolio-quality artifact.`,
          why: "Retention and applied quality keep you interview-ready over time.",
          deliverable:
            "Updated quiz/result snapshot plus one polished implementation artifact.",
          estimateHours: 2,
          difficulty: "medium",
          done: false,
          completedAt: null,
        },
      ],
      done: false,
      completedAt: null,
    };
  });

  return {
    title: companyName
      ? `${totalWeeks}-week ${targetRole} mastery roadmap for ${companyName}`
      : `${totalWeeks}-week ${targetRole} mastery roadmap`,
    weeks,
  };
};

export const buildPromptPayload = ({
  totalWeeks,
  targetRole,
  targetCompany,
  skillProfiles,
  detectedSkills,
  resumeText,
  prioritizedSkills,
}) => ({
  totalWeeks,
  targetRole,
  targetCompany: targetCompany
    ? {
        id: targetCompany.id,
        name: targetCompany.name,
        requiredSkills:
          targetCompany.roles?.[targetRole]?.requiredSkills?.map((s) => ({
            skill: s.skill,
            minimumDepth: s.minimumDepth,
            weight: s.weight,
            focus: s.focus ?? [],
          })) ?? [],
      }
    : null,
  studentSkills: skillProfiles.map((s) => ({
    skill: s.skill,
    depthScore: s.depthScore ?? 0,
    depthLevel: s.depthLevel ?? "Beginner",
  })),
  resumeText: resumeText || "",
  resumeSkills: detectedSkills || [],
  prioritizedSkills,
});

export const derivePrioritizedSkills = (
  skillProfiles,
  targetRoleData,
  roleRequiredSkills = [],
  detectedSkills = []
) => {
  const depthMap = {};
  for (const s of skillProfiles) {
    depthMap[s.skill] = s.depthScore ?? 0;
  }

  const ranked = [];
  const seen = new Set();

  // 1. Gaps relative to a specific company target
  for (const req of targetRoleData?.requiredSkills ?? []) {
    const depth = depthMap[req.skill] ?? 0;
    const gap = Math.max(req.minimumDepth - depth, 0);
    ranked.push({ skill: req.skill, score: gap * (req.weight || 1) + 2000 });
    seen.add(req.skill);
  }

  // 2. Gaps relative to the resume (Missing Skills for the target role)
  for (const skill of roleRequiredSkills) {
    if (seen.has(skill)) continue;
    if (!detectedSkills.includes(skill)) {
      // High priority for skills missing from resume
      ranked.push({ skill, score: 1500 });
      seen.add(skill);
    }
  }

  // 3. General skill profile improvements
  for (const s of skillProfiles) {
    if (seen.has(s.skill)) continue;
    ranked.push({ skill: s.skill, score: 100 - (s.depthScore ?? 0) });
  }

  ranked.sort((a, b) => b.score - a.score);
  return [...new Set(ranked.map((x) => x.skill).filter(Boolean))];
};

export const computeRoadmapCompletion = (weeks) => {
  const total = weeks.reduce((sum, w) => sum + (w.tasks?.length || 0), 0);
  if (total === 0) return 0;
  const done = weeks.reduce(
    (sum, w) => sum + (w.tasks || []).filter((t) => t.done).length,
    0
  );
  return Math.round((done / total) * 100);
};

export const generateRoadmapWithAI = async ({
  totalWeeks,
  targetRole,
  targetCompanyId,
  skillProfiles,
  roleRequiredSkills = [],
  detectedSkills = [],
  resumeText = "",
}) => {
  const targetCompany = targetCompanyId ? getCompanyById(targetCompanyId) : null;
  const targetRoleData = targetCompany?.roles?.[targetRole] ?? null;
  const depthMap = buildDepthMap(skillProfiles);
  const currentCompanyMatch = targetRoleData
    ? calcCompanyMatchPercent(targetRoleData, depthMap)
    : 0;

  // Consistent behavior: if already fully ready for selected target company,
  // generate a mastery/maintenance roadmap (not a gap-remediation roadmap).
  if (targetCompany && targetRoleData && currentCompanyMatch >= 100) {
    const mastery = buildMasteryRoadmap({
      totalWeeks,
      targetRole,
      companyName: targetCompany.name,
      targetRoleData,
      skillProfiles,
    });
    return { ...mastery, source: "fallback" };
  }

  const prioritizedSkills = derivePrioritizedSkills(
    skillProfiles,
    targetRoleData,
    roleRequiredSkills,
    detectedSkills
  );

  const fallback = buildFallbackRoadmap({
    totalWeeks,
    targetRole,
    companyName: targetCompany?.name ?? null,
    prioritizedSkills,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ...fallback, source: "fallback" };
  }

  const payload = buildPromptPayload({
    totalWeeks,
    targetRole,
    targetCompany,
    skillProfiles,
    detectedSkills,
    resumeText,
    prioritizedSkills,
  });

  const system = [
    "You are an expert placement mentor.",
    "Return ONLY valid JSON.",
    "Create practical weekly tasks for a student.",
    "Every task MUST include: title, description, why, deliverable, estimateHours (1-8), difficulty (easy|medium|hard).",
    "Description must be specific and actionable (at least 2 sentences).",
    "Avoid vague tasks like 'learn X'.",
    "Include quiz retest checkpoints in roadmap.",
  ].join(" ");

  const user = [
    "Generate a personalized roadmap JSON with this schema:",
    "{",
    '  "title": "string",',
    '  "weeks": [',
    "    {",
    '      "weekNumber": number,',
    '      "theme": "string",',
    '      "goal": "string",',
    '      "skillFocus": ["skillId"],',
    '      "tasks": [',
    "        {",
    '          "title": "string",',
    '          "description": "string",',
    '          "why": "string",',
    '          "deliverable": "string",',
    '          "estimateHours": number,',
    '          "difficulty": "easy|medium|hard"',
    "        }",
    "      ]",
    "    }",
    "  ]",
    "}",
    "Use exactly totalWeeks weeks, each with 3-5 tasks.",
    `Student context: ${JSON.stringify(payload)}`,
  ].join("\n");

  try {
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${system}\n\n${user}` }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      console.error("Gemini API Error:", await response.text());
      return { ...fallback, source: "fallback" };
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return { ...fallback, source: "fallback" };
    }

    const parsed = safeJsonParse(content);
    const normalized = normalizeRoadmapOutput(parsed, totalWeeks);
    return { ...normalized, source: "ai" };
  } catch (error) {
    console.error("Gemini Catch Error:", error);
    return { ...fallback, source: "fallback" };
  }
};

