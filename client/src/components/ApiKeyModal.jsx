import React, { useState } from "react";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { saveUserApiKey } from "../utils/apiKey";

export default function ApiKeyModal({
  required = false,
  onSuccess,
  onSkip,
}) {
  const [value, setValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setError("");
    const trimmed = value.trim();
    if (!trimmed.startsWith("AIza")) {
      setError("Key must start with AIza (Google API key format).");
      return;
    }
    setSaving(true);
    try {
      saveUserApiKey(trimmed);
      setValue("");
      onSuccess?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#011813]/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg max-h-[min(90vh,720px)] overflow-y-auto rounded-2xl border border-[rgba(0,157,119,0.2)] bg-white shadow-2xl shadow-black/20 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={() => onSkip?.()}
          className="absolute top-4 right-4 p-2 text-[#98A2B3] hover:text-[#011813] hover:bg-[#F8F9FA] rounded-xl transition-all z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2
              id="api-key-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-[#011813] tracking-tight"
            >
              Enter your Gemini API Key
            </h2>
            <p className="mt-2 text-sm font-medium text-[#475467]">
              Required to use roadmap generation and interview features
            </p>
            {required && (
              <p className="mt-3 text-sm font-semibold text-[#EA4C89]">
                You need an API key to use this feature
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8D8E8F]">
              API key
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                autoComplete="off"
                spellCheck={false}
                placeholder="AIzaSy…"
                className="w-full rounded-xl border border-[#E7E7E8] bg-[#F8F9FA] py-3 pl-4 pr-12 text-sm font-medium text-[#011813] outline-none focus:border-[#009D77] focus:ring-2 focus:ring-[rgba(0,157,119,0.15)]"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 p-1.5 rounded-lg text-[#475467] hover:bg-[#E7E7E8]/80"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-sm font-semibold text-[#EA4C89]">{error}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#009D77] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#009D77]/25 hover:bg-[#008a68] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Save &amp; Continue
            </button>
            {!required && (
              <button
                type="button"
                onClick={() => onSkip?.()}
                className="flex-1 rounded-xl border border-[#E7E7E8] bg-white py-3.5 text-sm font-bold text-[#475467] hover:bg-[#F8F9FA] transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          <div className="rounded-xl border border-[#E7E7E8] bg-[#F8F9FA] p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-[#011813]">
              How to get your free Gemini API key
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-[#475467] font-medium leading-relaxed">
              <li>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#009D77] hover:underline"
                >
                  Go to Google AI Studio
                </a>
              </li>
              <li>Sign in with your Google account</li>
              <li>Click &apos;Create API key&apos; and select any project</li>
              <li>
                Copy the key (starts with AIzaSy...) and paste it above
              </li>
            </ol>
            <p className="text-xs font-medium text-[#475467] leading-relaxed">
              Free tier gives you 15 requests/min and 1,500 requests/day — no
              credit card needed.
            </p>
            <p className="text-[11px] font-medium text-[#98A2B3] leading-relaxed">
              Your key is stored in your browser and sent directly to Google. We
              never store it on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
