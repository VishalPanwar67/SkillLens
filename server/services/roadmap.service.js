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

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const toLabel = (skill) => SKILL_LABELS[skill] || skill;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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

const buildPromptPayload = ({
  totalWeeks,
  targetRole,
  targetCompany,
  skillProfiles,
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
  prioritizedSkills,
});

export const derivePrioritizedSkills = (skillProfiles, targetCompanyRoleData) => {
  const depthMap = {};
  for (const s of skillProfiles) {
    depthMap[s.skill] = s.depthScore ?? 0;
  }

  const ranked = [];
  const seen = new Set();

  for (const req of targetCompanyRoleData?.requiredSkills ?? []) {
    const depth = depthMap[req.skill] ?? 0;
    const gap = Math.max(req.minimumDepth - depth, 0);
    ranked.push({ skill: req.skill, score: gap * (req.weight || 1) + 1000 });
    seen.add(req.skill);
  }

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
}) => {
  const targetCompany = targetCompanyId ? getCompanyById(targetCompanyId) : null;
  const targetRoleData = targetCompany?.roles?.[targetRole] ?? null;
  const prioritizedSkills = derivePrioritizedSkills(skillProfiles, targetRoleData);

  const fallback = buildFallbackRoadmap({
    totalWeeks,
    targetRole,
    companyName: targetCompany?.name ?? null,
    prioritizedSkills,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ...fallback, source: "fallback" };
  }

  const model = process.env.OPENAI_ROADMAP_MODEL || "gpt-4o-mini";
  const payload = buildPromptPayload({
    totalWeeks,
    targetRole,
    targetCompany,
    skillProfiles,
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
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      return { ...fallback, source: "fallback" };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { ...fallback, source: "fallback" };
    }

    const parsed = safeJsonParse(content);
    const normalized = normalizeRoadmapOutput(parsed, totalWeeks);
    return { ...normalized, source: "ai" };
  } catch {
    return { ...fallback, source: "fallback" };
  }
};

