import { apiUrl } from "../config/api";
import { getUserApiKey } from "./apiKey";

/**
 * Fetch to the SkillLens API with auth-friendly defaults and optional `x-gemini-key`.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : apiUrl(path);
  const userKey = getUserApiKey();

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(userKey ? { "x-gemini-key": userKey } : {}),
      ...(options.headers || {}),
    },
  });
}
