import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateGeminiText, hasGeminiApiKey } from "./gemini.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let lastGeminiQuotaLogMs = 0;

const logGeminiFailureOncePerMinute = (label, err) => {
  const msg = err?.message || String(err);
  const isQuota =
    /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg) ||
    err?.code === "RESOURCE_EXHAUSTED";
  if (isQuota && label === "evaluate answer") {
    const now = Date.now();
    if (now - lastGeminiQuotaLogMs < 60_000) return;
    lastGeminiQuotaLogMs = now;
  }
  console.warn(`[interview] ${label}:`, msg.slice(0, 400));
};

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }
    throw new Error("INTERVIEW_JSON_PARSE_FAILED");
  }
};

/**
 * Interview questions come only from the static bank (no AI).
 * Topic keys must match server/data/interviews.json.
 */
export function getInterviewQuestionsFromBank(usedTopic, rawTopic) {
  const p = path.join(__dirname, "../data/interviews.json");
  const bank = JSON.parse(readFileSync(p, "utf8"));
  const list =
    bank[usedTopic] ||
    bank[rawTopic] ||
    bank.react ||
    bank.js ||
    Object.values(bank)[0];
  const shuffled = [...(list || [])].sort(() => Math.random() - 0.5).slice(0, 5);
  return { questions: shuffled };
}

export const evaluateAnswer = async (question, answer, ideal) => {
  const systemInstruction = [
    "You are a strict technical interviewer.",
    "Evaluate the user's answer against the ideal answer.",
    "Be very strict. If the user says 'I don't know', 'skip', or similar, give a rating of 1 and a score of 0.",
    "Return JSON only.",
    "Schema: { 'rating': number (1-5), 'score': number (0-100), 'sentiment': string, 'critique': string (2-3 sentences) }",
    "Identify specific technical gaps.",
  ].join(" ");

  const user = `Question: ${question}\nIdeal Answer: ${ideal}\nUser Answer: ${answer}`;

  if (hasGeminiApiKey()) {
    try {
      const raw = await generateGeminiText({
        systemInstruction,
        prompt: user,
        temperature: 0.4,
        responseMimeType: "application/json",
      });
      if (raw) return safeJsonParse(raw);
    } catch (e) {
      logGeminiFailureOncePerMinute("evaluate answer", e);
    }
  }

  const lowAnswer = (answer || "").toLowerCase();
  const evasive = ["don't know", "no idea", "skip", "pass", "not sure"].some((v) =>
    lowAnswer.includes(v)
  );
  if (evasive || lowAnswer.length < 15) {
    return {
      rating: 1,
      score: 0,
      sentiment: "Poor",
      critique: "User failed to provide a technical answer or stated lack of knowledge.",
    };
  }

  return {
    rating: 3,
    score: 50,
    sentiment: "Average",
    critique:
      "AI scoring is unavailable (set GEMINI_API_KEY in server/config/.env or check quota). This is a basic heuristic only.",
  };
};
