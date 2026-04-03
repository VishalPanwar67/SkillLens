import React, { useState, useEffect, useRef, useMemo } from "react";
import { apiUrl } from "../config/api";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Trophy,
  Clock,
  Target,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  ChevronRight,
  X,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

const QUIZZES_PER_PAGE = 8;

export default function Quiz() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [sessionSkills, setSessionSkills] = useState(null);
  const [quizPage, setQuizPage] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const quizGridScrollRef = useRef(null);

  const totalQuizPages = Math.max(
    1,
    Math.ceil(quizzes.length / QUIZZES_PER_PAGE)
  );

  const pagedQuizzes = useMemo(() => {
    const start = quizPage * QUIZZES_PER_PAGE;
    return quizzes.slice(start, start + QUIZZES_PER_PAGE);
  }, [quizzes, quizPage]);

  useEffect(() => {
    setQuizPage(0);
  }, [quizzes.length]);

  useEffect(() => {
    if (quizGridScrollRef.current) {
      quizGridScrollRef.current.scrollTop = 0;
    }
  }, [quizPage]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [skillsRes, profRes] = await Promise.all([
          fetch(apiUrl("/api/quiz/skills"), { headers }),
          fetch(apiUrl("/api/quiz/profiles"), { headers }),
        ]);
        const skillsData = await skillsRes.json();
        const profData = await profRes.json();
        if (skillsData.success && skillsData.data?.skills) {
          const labels = skillsData.data.labels || {};
          const profilesMap = (profData.data?.profiles || []).reduce(
            (acc, p) => {
              acc[p.skill] = p;
              return acc;
            },
            {}
          );
          const mappedQuizzes = skillsData.data.skills.map((skill) => {
            const prof = profilesMap[skill];
            const label = labels[skill] || skill;
            const tierMatch = skill.match(
              /^(javascript|typescript|java|python|sql|nodejs|react|mongodb)_(basic|mid|advanced)$/
            );
            const tierLabel = tierMatch
              ? { basic: "Basic", mid: "Mid", advanced: "Advanced" }[tierMatch[2]]
              : null;
            return {
              title: `${label} Proficiency`,
              category: "Assessment",
              time: "10 min",
              questions: 10,
              difficulty: tierLabel || "Adaptive",
              completed: prof && prof.quizAttempts > 0,
              score: prof
                ? `${Math.min(100, Math.round(Number(prof.depthScore) || 0))}%`
                : "0%",
              rawSkill: skill,
            };
          });
          setQuizzes(mappedQuizzes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const startQuiz = async (skill) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/quiz/questions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills: [skill] }),
      });
      if (res.status === 403) {
        setShowCreditModal(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setActiveQuiz(data.data.questions);
        setSessionSkills(data.data.skills || [skill]);
        setCurrentQuestionIdx(0);
        setAnswers([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start quiz session.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, selectedIdx) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = { questionId, selectedIndex: selectedIdx };
    setAnswers(newAnswers);
  };

  const submitFinalQuiz = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/quiz/submit"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          timeSpentSeconds: 60,
          skills: sessionSkills,
        }),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/results?id=${data.data.attemptId}`);
      }
    } catch (err) {
      alert("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (activeQuiz) {
    const q = activeQuiz[currentQuestionIdx];
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-[#E7E7E8] relative flex flex-col"
        >
          {/* Progress Bar Top */}
          <div className="absolute top-0 left-0 h-1.5 bg-[#F8F9FA] w-full rounded-t-2xl overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(currentQuestionIdx / activeQuiz.length) * 100}%`,
              }}
              className="h-full bg-gradient-to-r from-[#009D77] to-[#EC4899]"
            />
          </div>

          <div className="flex justify-between items-center mb-6 mt-2">
            <span className="text-[#009D77] font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Q {currentQuestionIdx + 1} OF{" "}
              {activeQuiz.length}
            </span>
            <span className="px-2.5 py-1 bg-[#F8F9FA] rounded-md text-[9px] font-bold text-[#475467] border border-[#E7E7E8] uppercase tracking-wider">
              {q.skill} · {q.difficulty}
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-bold text-[#011813] mb-8 leading-relaxed">
            {q.question}
          </h2>

          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(q.id, idx)}
                className={`w-full p-4 rounded-xl text-left font-medium text-sm transition-all border group flex items-center ${answers[currentQuestionIdx]?.selectedIndex === idx ? "border-[#009D77] bg-[#E8FAF5] text-[#011813] shadow-sm" : "border-[#E7E7E8] bg-white text-[#475467] hover:border-[#D0D5DD] hover:bg-[#F8F9FA]"}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded bg-white shadow-sm border mr-4 text-[10px] font-bold transition-colors ${answers[currentQuestionIdx]?.selectedIndex === idx ? "border-[#009D77] text-[#009D77]" : "border-[#E7E7E8] text-[#98A2B3] group-hover:text-[#475467]"}`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3 pt-6 border-t border-[#E7E7E8]">
            {currentQuestionIdx > 0 && (
              <button
                onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                className="flex-1 py-3 bg-[#F8F9FA] border border-[#E7E7E8] text-[#475467] rounded-xl font-bold text-sm hover:bg-[#E7E7E8] transition-all"
              >
                Go Back
              </button>
            )}
            {currentQuestionIdx < activeQuiz.length - 1 ? (
              <button
                disabled={answers[currentQuestionIdx] === undefined}
                onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                className="flex-[2] py-3 bg-[#011813] text-white rounded-xl font-bold text-sm hover:bg-[#08241b] disabled:opacity-50 transition-all shadow-sm"
              >
                Confirm & Next
              </button>
            ) : (
              <button
                disabled={
                  submitting || answers[currentQuestionIdx] === undefined
                }
                onClick={submitFinalQuiz}
                className="flex-[2] py-3 bg-[#009D77] text-white rounded-xl font-bold text-sm hover:bg-[#008A68] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit Assessment"
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pb-12 px-4 sm:px-6">
      <main className="w-full max-w-6xl mx-auto flex flex-col gap-6 relative z-10 pt-4">
        {/* Header Compact */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center bg-white border border-[#E7E7E8] rounded-2xl p-4 shadow-sm shrink-0"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-extrabold text-[#011813] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#009D77]" /> Assessments
              </h1>
              <span className="px-2 py-0.5 bg-[#E8FAF5] text-[#009D77] rounded flex items-center gap-1 text-[9px] font-bold border border-[rgba(0,157,119,0.12)]">
                {quizzes.length} IN PROGRESS
              </span>
            </div>
            <p className="text-[11px] font-semibold text-[#475467]">
              Complete technical challenges to unlock roadmap tiers.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-[#F8F9FA] border border-[#E7E7E8] p-2 rounded-xl">
            <div className="w-8 h-8 bg-white border border-[#E7E7E8] rounded-lg shrink-0 flex items-center justify-center shadow-sm">
              <Trophy className="w-4 h-4 text-[#EC4899]" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#98A2B3] uppercase tracking-wider mb-0.5">
                Ranking Rank
              </p>
              <p className="text-[11px] font-extrabold text-[#011813]">
                Top 15% User
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quizzes Container */}
        <div className="bg-white border border-[#E7E7E8] rounded-[2.5rem] shadow-sm p-4 md:p-6 flex flex-col min-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <Loader2 className="w-8 h-8 animate-spin text-[#009D77] mb-3" />
              <p className="text-sm font-bold text-[#475467]">
                Fetching assessments...
              </p>
            </div>
          ) : (
            <div
              ref={quizGridScrollRef}
              className="flex-1 overflow-y-auto px-1 pr-3 custom-scrollbar"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 ml:grid-cols-3 lg:grid-cols-4 gap-4">
                {pagedQuizzes.map((quiz, index) => (
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    key={`${quiz.rawSkill}-${quizPage}`}
                    className="bg-white border border-[#E7E7E8] hover:border-[#009D77] rounded-2xl p-5 shadow-sm hover:shadow-[0_12px_40px_rgba(0,157,119,0.12)] transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Tags Top */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 bg-[#F8F9FA] border border-[#E7E7E8] text-[#475467] rounded text-[9px] font-bold uppercase tracking-wider group-hover:bg-[#009D77] group-hover:text-white group-hover:border-[#009D77] transition-all">
                          {quiz.category}
                        </span>
                        {quiz.completed ? (
                          <span className="bg-[#E8FAF5] text-[#009D77] px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-2.5 h-2.5" />{" "}
                            {quiz.score}
                          </span>
                        ) : (
                          <span className="bg-white border border-[#E7E7E8] text-[#EC4899] px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 shadow-sm group-hover:border-[#EC4899]/30 transition-colors">
                            <Target className="w-2.5 h-2.5" /> Incomplete
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      <h3 className="text-sm font-extrabold text-[#011813] mb-2 leading-tight group-hover:text-[#009D77] transition-colors line-clamp-2">
                        {quiz.title}
                      </h3>

                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#98A2B3] mb-5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 group-hover:text-[#009D77] transition-colors" />{" "}
                          {quiz.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 group-hover:text-[#009D77] transition-colors" />{" "}
                          {quiz.questions} Q
                        </span>
                        {quiz.difficulty !== "Adaptive" && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F8F9FA] border border-[#E7E7E8] text-[#475467]">
                            {quiz.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => startQuiz(quiz.rawSkill)}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${quiz.completed
                          ? "bg-white border border-[#009D77] text-[#009D77] hover:bg-[#E8FAF5]"
                          : "bg-[#011813] text-white border border-[#011813] group-hover:bg-[#009D77] group-hover:border-[#009D77] group-hover:shadow-[0_4px_14px_rgba(0,157,119,0.39)]"
                        }`}
                    >
                      {quiz.completed ? "Retake" : "Start Assessment"}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {!loading && quizzes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-1 border-t border-[#E7E7E8] shrink-0 px-1">
              <p className="text-[11px] font-semibold text-[#475467] order-2 sm:order-1">
                Showing{" "}
                {quizPage * QUIZZES_PER_PAGE + 1}
                –
                {Math.min(
                  (quizPage + 1) * QUIZZES_PER_PAGE,
                  quizzes.length
                )}{" "}
                of {quizzes.length}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  type="button"
                  disabled={quizPage <= 0}
                  onClick={() => setQuizPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-[#E7E7E8] bg-white text-[#011813] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <span className="text-[11px] font-bold text-[#98A2B3] tabular-nums px-1">
                  Page {quizPage + 1} / {totalQuizPages}
                </span>
                <button
                  type="button"
                  disabled={quizPage >= totalQuizPages - 1}
                  onClick={() =>
                    setQuizPage((p) =>
                      Math.min(totalQuizPages - 1, p + 1)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-[#011813] bg-[#011813] text-white hover:bg-[#009D77] hover:border-[#009D77] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Beautiful Credit Modal */}
      <AnimatePresence>
        {showCreditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#011813]/60 backdrop-blur-md"
              onClick={() => setShowCreditModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-[#009D77]/10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8FAF5] rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFF0F6] rounded-full -ml-12 -mb-12" />

              <div className="relative p-8 text-center">
                <div className="w-16 h-16 bg-[#F8FAFF] border-4 border-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3 transition-transform hover:rotate-0">
                  <Zap className="w-8 h-8 text-[#009D77]" />
                </div>

                <h2 className="text-2xl font-black text-[#011813] mb-3 tracking-tight">Assessment Unavailable</h2>
                <div className="px-6 py-2 bg-[#E8FAF5] rounded-full inline-block mb-6 border border-[#009D77]/10">
                  <p className="text-[10px] font-black text-[#009D77] uppercase tracking-widest flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Insufficient Credits
                  </p>
                </div>

                <p className="text-sm text-[#475467] font-medium leading-relaxed mb-8 px-4">
                  Assessment attempts cost <span className="text-[#009D77] font-bold underline underline-offset-4 decoration-2 decoration-[#009D77]/20">5 Credits for 1 Quizzes</span>. Upgrade your plan to unlock full technical validation.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => window.location.href = "/pricing"}
                    className="w-full py-4 bg-[#011813] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#009D77] transition-all shadow-lg shadow-[#011813]/20 group"
                  >
                    Buy More Credits <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowCreditModal(false)}
                    className="w-full py-4 bg-white text-[#475467] border border-[#E7E7E8] rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
                  >
                    Not Right Now
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowCreditModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-[#98A2B3]" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
