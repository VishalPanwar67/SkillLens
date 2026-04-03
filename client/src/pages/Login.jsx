import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  User,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { apiUrl } from "../config/api";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { hasUserApiKey } from "../utils/apiKey";
import ApiKeyModal from "../components/ApiKeyModal";

export default function Login() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Frontend");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [loginState, setLoginState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPostLoginApiKey, setShowPostLoginApiKey] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!name || !role) {
      setErrorMessage("Please enter your name and select a target role before continuing.");
      return;
    }

    setErrorMessage("");
    setLoginState("loading");

    try {
      // FORCE REAL FIREBASE GOOGLE LOGIN
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Could not retrieve a valid email from your Google account. Please try again.");
      }

      const response = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || user.displayName, // We prioritize the typed name for first enrollment as requested
          email: user.email,
          targetRole: role.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        if (hasUserApiKey()) {
          setLoginState("success");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
        } else {
          setLoginState("success");
          setShowPostLoginApiKey(true);
        }
      } else {
        setLoginState("idle");
        setErrorMessage(data.message || "Email identity error. Please use your original name.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setLoginState("idle");
      
      if (error.code === 'auth/configuration-not-found') {
        setErrorMessage("Firebase Error: Please enable 'Google' as a Sign-in provider in your Firebase Console (Authentication > Sign-in Method).");
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMessage("Firebase Error: Operations are currently disabled. Check your console settings.");
      } else {
        setErrorMessage(error.message || "Error connecting to backend API");
      }
    }
  };

  const roles = ["Frontend", "Backend", "Fullstack", "Data", "Java"];

  const finishLoginAndRedirect = () => {
    setShowPostLoginApiKey(false);
    setTimeout(() => {
      navigate("/dashboard");
    }, 400);
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {showPostLoginApiKey && (
        <ApiKeyModal
          required={false}
          onSuccess={finishLoginAndRedirect}
          onSkip={finishLoginAndRedirect}
        />
      )}
            <div className="w-full max-w-md px-1 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold bg-[#E8FAF5] text-[#009D77] border border-[rgba(0,157,119,0.2)]">
            <BookOpen className="w-3.5 h-3.5" />
            Unlock your potential
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#011813] tracking-tight leading-tight">
            Welcome to <span className="text-[#009D77]">SkillLens</span>
          </h1>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-[rgba(0,157,119,0.12)] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {loginState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <div className="w-20 h-20 bg-[#009D77] text-white rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-[#011813] mb-3 text-center tracking-tight">
                  Welcome aboard
                </h2>
                <p className="text-sm text-[#313233] font-semibold text-center flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#009D77]" />
                  Redirecting to dashboard…
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#8D8E8F] uppercase tracking-wider mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8E8F] pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-7 border-b border-[#E7E7E8] px-0 py-3 text-sm text-[#011813] placeholder:text-[#8D8E8F] bg-transparent focus:outline-none focus:border-b-[#009D77] transition-colors duration-150"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#8D8E8F] uppercase tracking-wider mb-1.5">
                      Select target role
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-full flex items-center justify-between border border-[rgba(0,157,119,0.2)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#011813] bg-white focus:outline-none focus:border-[#009D77] focus:ring-2 focus:ring-[rgba(0,157,119,0.12)] transition-colors duration-150"
                    >
                      {role}
                      <ChevronDown
                        className={`w-4 h-4 text-[#8D8E8F] transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isRoleDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E7E7E8] rounded-xl overflow-hidden z-20"
                        >
                          {roles.map((r) => (
                            <button
                              key={r}
                              type="button"
                              className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors duration-150 ${
                                role === r
                                  ? "bg-[#E8FAF5] text-[#009D77]"
                                  : "text-[#313233] hover:bg-[#F8F8F8]"
                              }`}
                              onClick={() => {
                                setRole(r);
                                setIsRoleDropdownOpen(false);
                              }}
                            >
                              {r}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {errorMessage && (
                  <div className="text-sm font-semibold text-center bg-[#FCE4EE] text-[#EA4C89] p-3 rounded-xl border border-[rgba(234,76,137,0.15)]">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loginState === "loading"}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-[rgba(0,157,119,0.3)] text-[#011813] rounded-xl py-3.5 transition-colors duration-150 hover:bg-[#E8FAF5] disabled:opacity-70 disabled:cursor-not-allowed font-bold text-sm"
                >
                  {loginState === "loading" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#009D77]" />
                  ) : (
                    <svg
                      className="w-5 h-5 shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>
                    {loginState === "loading"
                      ? "Authenticating…"
                      : "Continue with Google"}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="relative z-10 mt-12 text-center text-xs text-[#8D8E8F]">
        <p>© 2026 SkillLens. All rights reserved.</p>
      </footer>
    </div>
  );
}
