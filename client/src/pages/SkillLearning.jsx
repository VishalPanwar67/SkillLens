import React, { useState, useEffect, useRef } from "react";
import { apiUrl } from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Youtube,
  Code,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
  Target,
  ArrowLeft,
  MessageSquare,
  Calendar,
  Zap
} from "lucide-react";
import SkillRoadmapCard from "../components/Learning/SkillRoadmapCard";
import RoadmapDetails from "../components/Learning/RoadmapDetails";
import MockInterviewChat from "../components/Learning/MockInterviewChat";
import DailyPlanner from "../components/Learning/DailyPlanner";
import { useRequireApiKey } from "../hooks/useRequireApiKey";
import ApiKeyModal from "../components/ApiKeyModal";

export default function SkillLearning() {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInterview, setShowInterview] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [xp, setXp] = useState(0);
  const { showModal, setShowModal, checkKey } = useRequireApiKey();
  const openInterviewAfterKey = useRef(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // Get profile for missing skills
      const profileRes = await fetch(apiUrl('/api/auth/profile'), { headers });
      const profileData = await profileRes.json();
      const user = profileData?.data?.user;

      if (user) {
        // In a real app, missingSkills would be calculated or stored. 
        // For now let's derive them from targetRole required skills vs detected.
        // We can use a helper or call an endpoint.
        const roleRes = await fetch(apiUrl('/api/resume/analyze-current'), {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
        const roleData = await roleRes.json();
        const missing = roleData?.data?.missingSkills || [];

        // Enrich missing skills with basic info
        const enriched = missing.map(s => ({
          id: s,
          name: s.toUpperCase(),
          progress: 0,
          status: 'Not Started'
        }));

        setSkills(enriched);
        setXp(user.xp || 0);
      }
    } catch (err) {
      console.error("Error fetching learning data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = (skill) => {
    setSelectedSkill(skill);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#009D77]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {!selectedSkill ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            key="skill-grid"
            className="space-y-6"
          >
            {/* Header - Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#011813] tracking-tight uppercase">AI Growth Lab</h1>
                <p className="text-[#475467] font-bold text-[11px] uppercase tracking-widest opacity-60">Closing your skill gaps with precision.</p>
              </div>
              <div className="flex items-center gap-3 bg-white border border-[#E7E7E8] p-2.5 rounded-xl shadow-sm">
                <div className="w-9 h-9 bg-[#E8FAF5] rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#009D77]" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#475467]">Total XP</p>
                  <p className="text-lg font-black text-[#011813] leading-none">{xp}</p>
                </div>
              </div>
            </div>

            {/* Missing Skills Grid - Dense */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <SkillRoadmapCard
                    key={skill.id}
                    skill={skill}
                    onClick={() => handleSkillSelect(skill)}
                  />
                ))
              ) : (
                <div className="col-span-full bg-white border border-dashed border-[#D0D5DD] rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#009D77]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#011813]">All Skills Covered!</h3>
                  <p className="text-[#475467] mt-2 mb-6 max-w-xs mx-auto">
                    You have all the required skills for your target role. You can still practice or learn new ones.
                  </p>
                  <button className="bg-[#009D77] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#008a68] transition-all">
                    Explore New Skills
                  </button>
                </div>
              )}
            </div>

            {/* Smart Recommendation Engine */}

          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            key="skill-roadmap-details"
          >
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setSelectedSkill(null)}
                className="flex items-center gap-2 text-[#475467] font-bold hover:text-[#011813] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Dashboard
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!checkKey()) {
                      openInterviewAfterKey.current = true;
                      return;
                    }
                    setShowInterview(true);
                  }}
                  className="flex items-center gap-2 bg-[#009D77] text-white border border-[#009D77] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#008a68]"
                >
                  <MessageSquare className="w-4 h-4" /> AI Interview
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanner(true)}
                  className="flex items-center gap-2 bg-white border border-[#E7E7E8] px-4 py-2 rounded-xl text-sm font-bold text-[#011813] hover:bg-[#F8F9FA]"
                >
                  <Calendar className="w-4 h-4" /> Daily Plan
                </button>
              </div>
            </div>

            <RoadmapDetails
              skill={selectedSkill}
              onComplete={() => {
                setXp(prev => prev + 100);
                setSelectedSkill(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showModal && (
        <ApiKeyModal
          required={true}
          onSuccess={() => {
            setShowModal(false);
            if (openInterviewAfterKey.current) {
              openInterviewAfterKey.current = false;
              setShowInterview(true);
            }
          }}
        />
      )}
      {showInterview && (
        <MockInterviewChat
          skill={selectedSkill?.id || "Technical"}
          onClose={() => setShowInterview(false)}
        />
      )}

      {showPlanner && (
        <DailyPlanner
          skill={selectedSkill?.id}
          onClose={() => setShowPlanner(false)}
        />
      )}
    </div>
  );
}
