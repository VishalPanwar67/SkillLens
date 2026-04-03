/**
 * Google Gemini client (@google/generative-ai). Per-request API key from the client (x-gemini-key).
 * Env: GEMINI_MODEL (default gemini-2.5-flash), GEMINI_TIMEOUT_MS.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 60_000;

function createModel(systemInstruction, apiKey) {
  const key = String(apiKey || "").trim();
  if (!key) {
    const err = new Error("GEMINI_API_KEY_MISSING");
    err.code = "GEMINI_API_KEY_MISSING";
    throw err;
  }
  const genAI = new GoogleGenerativeAI(key);
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
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} [opts.systemInstruction]
 * @param {number} [opts.temperature]
 * @param {"application/json"|undefined} [opts.responseMimeType]
 * @param {number} [opts.timeoutMs]
 * @param {string} opts.apiKey - User Gemini API key (required)
 */
export async function generateGeminiText({
  prompt,
  systemInstruction,
  temperature = 0.7,
  responseMimeType,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  apiKey,
} = {}) {
  if (prompt === undefined || prompt === null || String(prompt).length === 0) {
    const err = new Error("GEMINI_PROMPT_REQUIRED");
    err.code = "GEMINI_PROMPT_REQUIRED";
    throw err;
  }

  const model = createModel(systemInstruction, apiKey);
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
