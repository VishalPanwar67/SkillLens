const STORAGE_KEY = "user_gemini_api_key";

export function getUserApiKey() {
  return localStorage.getItem(STORAGE_KEY) || null;
}

export function saveUserApiKey(key) {
  if (key) localStorage.setItem(STORAGE_KEY, key);
  else localStorage.removeItem(STORAGE_KEY);
}

export function hasUserApiKey() {
  const key = localStorage.getItem(STORAGE_KEY);
  return !!key && key.startsWith("AIza");
}

export function maskUserApiKey() {
  const key = getUserApiKey();
  if (!key || !key.startsWith("AIza")) return null;
  return `AIzaSy${"•".repeat(16)}`;
}
