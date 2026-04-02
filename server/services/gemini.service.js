/**
 * Central Google Gemini client (@google/generative-ai).
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (default gemini-2.5-flash), GEMINI_TIMEOUT_MS.
 * Note: Unversioned names like gemini-1.5-flash often return 404 after Google deprecations — use a current stable ID from https://ai.google.dev/gemini-api/docs/models/gemini
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 60_000;

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || "";
}

export function hasGeminiApiKey() {
  return !!getGeminiApiKey();
}

function createModel(systemInstruction) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY_MISSING");
    err.code = "GEMINI_API_KEY_MISSING";
    throw err;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const opts = { model: DEFAULT_GEMINI_MODEL };
  if (systemInstruction) {
    opts.systemInstruction = systemInstruction;
  }
  return genAI.getGenerativeModel(opts);
}

async function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`GEMINI_TIMEOUT_${ms}ms`);
      err.code = "GEMINI_TIMEOUT";
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate text from a single user turn. Returns trimmed model text only.
 *
 * @param {object} opts
 * @param {string} opts.prompt - User message / combined prompt when no systemInstruction
 * @param {string} [opts.systemInstruction] - System behavior (Gemini 1.5+)
 * @param {number} [opts.temperature]
 * @param {"application/json"|undefined} [opts.responseMimeType] - Set for JSON-only responses
 * @param {number} [opts.timeoutMs]
 */
export async function generateGeminiText({
  prompt,
  systemInstruction,
  temperature = 0.7,
  responseMimeType,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (prompt === undefined || prompt === null || String(prompt).length === 0) {
    const err = new Error("GEMINI_PROMPT_REQUIRED");
    err.code = "GEMINI_PROMPT_REQUIRED";
    throw err;
  }

  const model = createModel(systemInstruction);
  const generationConfig = { temperature };
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const request = model.generateContent({
    contents: [{ role: "user", parts: [{ text: String(prompt) }] }],
    generationConfig,
  });

  const result = await withTimeout(request, timeoutMs);
  let text;
  try {
    text = result.response.text();
  } catch (e) {
    const err = new Error(e?.message || "GEMINI_NO_TEXT");
    err.code = "GEMINI_RESPONSE_ERROR";
    err.cause = e;
    throw err;
  }
  return typeof text === "string" ? text.trim() : "";
}
