import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  Save,
  Github,
  Linkedin,
  Zap,
  Loader2,
  Camera,
  Globe,
  Edit3,
  ExternalLink,
  ChevronRight,
  Key,
} from "lucide-react";
import ApiKeyModal from "../components/ApiKeyModal";
import { hasUserApiKey, maskUserApiKey, saveUserApiKey } from "../utils/apiKey";

export default function Profile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    targetRole: "",
    bio: "",
    github: "",
    linkedin: "",
    profileImage: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [detectedSkills, setDetectedSkills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showApiKeySettingsModal, setShowApiKeySettingsModal] = useState(false);
  const [apiKeyTick, setApiKeyTick] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token");

        const profileRes = await fetch(apiUrl("/api/auth/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();

        if (profileData.success && profileData.data?.user) {
          const u = profileData.data.user;
          setFormData({
            name: u.name || "",
            email: u.email || "",
            targetRole: u.targetRole || "frontend",
            bio: u.bio || "",
            github: u.socials?.github || "",
            linkedin: u.socials?.linkedin || "",
            profileImage: u.profileImage || null,
          });
          setDetectedSkills(u.detectedSkills || []);
        }

        const statsRes = await fetch(apiUrl("/api/quiz/stats"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole: formData.targetRole.toLowerCase(),
          bio: formData.bio,
          profileImage: formData.profileImage,
          socials: { github: formData.github, linkedin: formData.linkedin },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setMessage("Profile synchronized!");
        setIsEditing(false); // Switch back to VIEW mode
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.message || "Failed to update.");
      }
    } catch (err) {
      setMessage("Connection error.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf9]">
        <Loader2 className="w-12 h-12 animate-spin text-[#11b589]" />
      </div>
    );

  return (
    <div className="min-h-screen flex items-start py-6 px-6">
      <main className="w-full relative z-10">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full bg-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm flex flex-col min-h-[calc(100vh-3rem)]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E7E8] mb-4">
                <div>
                  <h3 className="text-[13px] font-extrabold text-[#011813]">
                    Edit Profile
                  </h3>
                  <p className="text-[10px] text-[#8D8E8F] mt-0.5">
                    Update your professional information.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="flex flex-col items-center mb-3">
                  <div className="relative w-16 h-16 mb-1.5 group">
                    <div className="relative w-full h-full rounded-full border border-[#E7E7E8] bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                      {formData.profileImage ? (
                        <img
                          src={formData.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-[#009D77]" />
                      )}

                      <label className="absolute inset-x-0 bottom-0 bg-[#011813]/70 py-1 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-[#009D77]/90">
                        <Camera className="w-3 h-3 text-white" />
                        <span className="text-[7px] text-white font-bold uppercase mt-0.5">
                          Change
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full z-20">
                        <Loader2 className="w-5 h-5 animate-spin text-[#009D77]" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F]">
                      Full Name
                    </label>
                    <input
                      readOnly
                      value={formData.name}
                      className="w-full bg-[#F8F8F8] border border-[#E7E7E8] p-2.5 rounded-lg text-[#011813] text-xs opacity-70 cursor-not-allowed outline-none focus:ring-2 focus:ring-[#009D77]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F]">
                      Target Role
                    </label>
                    <select
                      name="targetRole"
                      value={formData.targetRole}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E7E7E8] p-2.5 rounded-lg text-[#011813] text-xs focus:ring-2 focus:ring-[#009D77]/20 outline-none transition-shadow"
                    >
                      <option value="frontend">Frontend Developer</option>
                      <option value="backend">Backend Developer</option>
                      <option value="fullstack">Fullstack Ninja</option>
                      <option value="data">Data Architect</option>
                      <option value="java">Enterprise Java</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F]">
                    Professional Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-white border border-[#E7E7E8] p-2.5 rounded-lg text-[#011813] text-xs focus:ring-2 focus:ring-[#009D77]/20 outline-none resize-none transition-shadow"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F]">
                      GitHub URL
                    </label>
                    <div className="relative">
                      <Github className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                      <input
                        name="github"
                        value={formData.github}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#E7E7E8] p-2.5 pl-8 rounded-lg text-[#011813] text-xs focus:ring-2 focus:ring-[#009D77]/20 outline-none transition-shadow"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F]">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#98A2B3]" />
                      <input
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#E7E7E8] p-2.5 pl-8 rounded-lg text-[#011813] text-xs focus:ring-2 focus:ring-[#009D77]/20 outline-none transition-shadow"
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E7E7E8] mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="border border-[#E7E7E8] text-[#475467] hover:bg-[#F8F8F8] rounded-lg px-4 py-2 text-[11px] font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#EA4C89] hover:bg-[#d93a86] text-white rounded-lg px-5 py-2 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Details
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full bg-white border border-[#E7E7E8] rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 sm:grid-cols-[240px_1fr] min-h-[calc(100vh-3rem)]"
            >
              <div className="bg-[#E8FAF5] border-b sm:border-b-0 sm:border-r border-[#BDF1E5] p-6 flex flex-col items-center gap-5 min-h-full">
                <div
                  className="w-[90px] h-[90px] rounded-full p-[8px] flex-shrink-0"
                  // style={{
                  //   background: `conic-gradient(#009D77 0% ${Math.min(100, Math.max(0, stats?.avgScore ?? 0))}%, #EA4C89 ${Math.min(100, Math.max(0, stats?.avgScore ?? 0))}% 100%)`,
                  // }}
                >
                  <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center overflow-hidden mx-auto">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-9 h-9 text-[#009D77]" />
                    )}
                  </div>
                </div>

                <div className="text-center flex-1 min-w-[120px] sm:w-full sm:flex-none sm:min-w-0">
                  <h2 className="text-[15px] font-extrabold text-[#011813] leading-tight">
                    {formData.name}
                  </h2>
                  <p className="text-[11px] text-[#009D77] font-semibold mt-0.5 capitalize flex items-center justify-center gap-1">
                    <Globe className="w-3 h-3" />{" "}
                    {formData.targetRole || "Role Not Set"}
                  </p>
                </div>

                <div className="hidden sm:block w-10 h-px bg-[#BDF1E5] sm:mx-auto" />

                <div className="text-center sm:w-full flex-shrink-0">
                  <p className="text-[32px] font-extrabold text-[#EA4C89] leading-none">
                    {stats?.avgScore || 0}%
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F] mt-1">
                    Avg Score
                  </p>
                </div>

                {detectedSkills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 w-full basis-full sm:basis-auto">
                    {detectedSkills.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#FCE4EE] border border-[rgba(234,76,137,0.2)] rounded-full text-[9px] font-semibold text-[#EA4C89]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-7 flex flex-col gap-5 relative min-h-full bg-white">
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute top-5 right-5 flex items-center gap-1 bg-white border border-[#E7E7E8] text-[#011813] px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#F8F8F8] transition-colors shadow-sm"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F] mb-2">
                    Overview
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#F8F8F8] rounded-xl p-3 text-center border border-[#E7E7E8]">
                      <p className="text-[20px] font-extrabold text-[#011813]">
                        {stats?.totalAttempts || 0}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8D8E8F] mt-0.5">
                        Quizzes
                      </p>
                    </div>
                    <div className="flex-1 bg-[#F8F8F8] rounded-xl p-3 text-center border border-[#E7E7E8]">
                      <p className="text-[20px] font-extrabold text-[#EA4C89]">
                        {stats?.avgScore || 0}%
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8D8E8F] mt-0.5">
                        Avg Score
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#E7E7E8]" />

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F] mb-2">
                    Score Progress
                  </p>
                  <div className="h-2 bg-[#F8F8F8] rounded-full overflow-hidden border border-[#E7E7E8]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stats?.avgScore || 0}%`,
                        background: "linear-gradient(90deg, #009D77, #EA4C89)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#8D8E8F] text-right mt-1">
                    {stats?.avgScore || 0} / 100
                  </p>
                </div>

                <div className="h-px bg-[#E7E7E8]" />

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F] mb-2">
                    Bio
                  </p>
                  {formData.bio ? (
                    <p className="text-[12px] text-[#475467] leading-relaxed bg-[#F8F8F8] rounded-lg px-3 py-2.5 border border-[#E7E7E8] italic">
                      {formData.bio}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#8D8E8F] bg-[#F8F8F8] rounded-lg px-3 py-2.5 border border-dashed border-[#E7E7E8] italic text-center">
                      No bio yet. Click Edit to add one.
                    </p>
                  )}
                </div>

                <div className="h-px bg-[#E7E7E8]" />

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F] mb-2 flex items-center gap-2">
                    <Key className="w-3 h-3 text-[#009D77]" />
                    Gemini API key
                  </p>
                  {hasUserApiKey() ? (
                    <div className="space-y-3">
                      <p
                        className="text-[12px] font-mono font-semibold text-[#011813] bg-[#F8F8F8] rounded-lg px-3 py-2 border border-[#E7E7E8]"
                        key={apiKeyTick}
                      >
                        {maskUserApiKey()}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setShowApiKeySettingsModal(true)}
                          className="text-[11px] font-bold text-[#009D77] border border-[#009D77]/30 rounded-lg px-3 py-1.5 hover:bg-[#E8FAF5] transition-colors"
                        >
                          Update key
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            saveUserApiKey(null);
                            setApiKeyTick((t) => t + 1);
                          }}
                          className="text-[11px] font-bold text-[#475467] border border-[#E7E7E8] rounded-lg px-3 py-1.5 hover:bg-[#F8F8F8] transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#8D8E8F] leading-relaxed">
                        No key saved. Add your Gemini key to use roadmap generation
                        and interview features.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowApiKeySettingsModal(true)}
                        className="text-[11px] font-bold text-white bg-[#009D77] rounded-lg px-3 py-1.5 hover:bg-[#008a68] transition-colors"
                      >
                        Add API key
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-px bg-[#E7E7E8]" />

                <div className="flex flex-col gap-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8D8E8F]">
                    Contact
                  </p>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#8D8E8F]">Email</span>
                    <span className="font-semibold text-[#011813] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#009D77]" />{" "}
                      {formData.email}
                    </span>
                  </div>
                  {formData.github && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#8D8E8F]">GitHub</span>
                      <a
                        href={formData.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#009D77] flex items-center gap-1 hover:underline"
                      >
                        <Github className="w-3.5 h-3.5" /> View Profile
                      </a>
                    </div>
                  )}
                  {formData.linkedin && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#8D8E8F]">LinkedIn</span>
                      <a
                        href={formData.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#0077b5] flex items-center gap-1 hover:underline"
                      >
                        <Linkedin className="w-3.5 h-3.5" /> View Profile
                      </a>
                    </div>
                  )}
                  {!formData.github && !formData.linkedin && (
                    <span className="text-[11px] text-[#8D8E8F] italic">
                      No social links added.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showApiKeySettingsModal && (
        <ApiKeyModal
          required={false}
          onSuccess={() => {
            setShowApiKeySettingsModal(false);
            setApiKeyTick((t) => t + 1);
          }}
          onSkip={() => setShowApiKeySettingsModal(false)}
        />
      )}

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#011813] text-white text-[11px] font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5 text-[#009D77]" /> {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
