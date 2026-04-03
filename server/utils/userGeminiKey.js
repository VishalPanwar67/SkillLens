import { ApiError } from "../class/index.class.js";

const GEMINI_KEY_MESSAGE =
  "Gemini API key required. Please add your key in settings.";

/**
 * Returns trimmed user Gemini key from `x-gemini-key` or null if absent.
 */
export function getUserGeminiKeyFromRequest(req) {
  const raw = req.headers["x-gemini-key"] ?? req.headers["X-Gemini-Key"];
  const key = typeof raw === "string" ? raw.trim() : "";
  if (!key) return null;
  if (!key.startsWith("AIza")) {
    throw new ApiError(401, GEMINI_KEY_MESSAGE);
  }
  return key;
}

export function requireUserGeminiKey(req) {
  const key = getUserGeminiKeyFromRequest(req);
  if (!key) {
    throw new ApiError(401, GEMINI_KEY_MESSAGE);
  }
  return key;
}
