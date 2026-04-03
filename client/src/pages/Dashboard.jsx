import React from "react";
import { apiUrl } from "../config/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  BookOpen,
  Brain,
  Briefcase,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  Zap,
  CreditCard
} from "lucide-react";

export default function Dashboard() {
  const [userData, setUserData] = React.useState({ name: "User", targetRole: "Guest" });
  const [stats, setStats] = React.useState({
    readinessScore: 0,
    skillsScore: 0,
    interviewScore: 0,
    roadmapScore: 0,
    topMatches: [],
    detectedSkillsCount: 0,
    nextStep: { title: "Take a skill quiz", desc: "Test your skills to generate your roadmap." }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const profileRes = await fetch(apiUrl("/api/auth/profile"), { headers });
        const profileData = await profileRes.json();
        const user = profileData?.data?.user;
        if (user) setUserData(user);

        const resumeScore = user?.lastResumeScore || 0;
        const rawHistory = user?.readinessHistory || [];

        const compRes = await fetch(apiUrl("/api/companies"), { headers });
        const compData = await compRes.json();
        let topMatches = [];
        let highestMatch = 0;
        if (compRes.ok && compData.success && compData.data.companies) {
          topMatches = compData.data.companies.slice(0, 3).map(c => ({
            name: c.name, score: c.matchPercent, strong: c.matchPercent >= 70
          }));
          highestMatch = compData.data.bestMatch?.matchPercent || 0;
        }

        const roadRes = await fetch(apiUrl("/api/roadmap"), { headers });
        const roadData = await roadRes.json();
        const roadmapScore = roadData.data?.completionPercent || 0;

        const profRes = await fetch(apiUrl("/api/quiz/profiles"), { headers });
        const profData = await profRes.json();
        let skillsScore = 0;
        if (profData.data?.profiles && profData.data.profiles.length > 0) {
          const profiles = profData.data.profiles;
          const avg = profiles.reduce((sum, p) => sum + (p.depthScore || 0), 0) / (profiles.length || 1);
          skillsScore = Math.round(avg);
        }

        const interviewScore = Math.min(100, skillsScore > 0 ? skillsScore + 5 : 0);
        // Readiness = weighted average pf resume, skills, and roadmap
        const readinessScore = Math.round((resumeScore * 0.4) + (skillsScore * 0.4) + (roadmapScore * 0.2)) || 0;

        let nextStep = { title: "Upload Resume", desc: "Start by analyzing your resume for skill gaps.", link: "/resume" };
        if (resumeScore > 0 && skillsScore === 0) {
          nextStep = { title: "Take a Quiz", desc: "Verify your detected skills with a quick assessment.", link: "/quiz" };
        } else if (skillsScore > 0 && roadmapScore === 0) {
          nextStep = { title: "View Roadmap", desc: "Build your personalized learning path now.", link: "/roadmap" };
        } else if (roadmapScore > 0 && roadmapScore < 100) {
          nextStep = { title: "Continue Roadmap", desc: "Keep going! You're making great progress.", link: "/roadmap" };
        } else if (highestMatch >= 70) {
          nextStep = { title: "Apply Now", desc: "You have strong matches! Time to reach out.", link: "/company" };
        }

        // Map history to chart bars
        const historyBars = rawHistory.slice(-7).map(h => ({
          date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          height: `${h.score}%`,
          active: true
        }));

        setStats({
          readinessScore,
          skillsScore,
          interviewScore,
          roadmapScore,
          topMatches,
          nextStep,
          detectedSkillsCount: user?.detectedSkills?.length || 0,
          historyBars: historyBars.length > 0 ? historyBars : [
            { date: "N/A", height: "0%", active: false }
          ]
        });

      } catch (err) {
        console.error("Dashboard data fetch error", err);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen relative pb-12">
      <div className="max-w-5xl mx-auto space-y-6 relative">
        {/* Page title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black text-[#011813] tracking-tight">
                Dashboard
              </h1>
              <p className="text-[13px] text-[#475467] font-medium">Overview of your preparation progress</p>
            </div>
            
            {/* Small Credit Badge */}
            <Link to="/pricing" className="flex items-center gap-2.5 bg-white border border-[#E7E7E8] px-3.5 py-1.5 rounded-2xl hover:border-[#009D77] transition-all group shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-[#E8FAF5] flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#009D77]" />
              </div>
              <div className="flex flex-col -space-y-0.5">
                <span className="text-[9px] font-black text-[#98A2B3] uppercase tracking-widest leading-none">Your Balance</span>
                <span className="text-sm font-black text-[#011813]">{userData.credits || 0} <span className="text-[10px] opacity-50">Credits</span></span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#009D77] transition-colors ml-1" />
            </Link>
          </div>

        {/* Greeting & Quick Status */}
        <div className="bg-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm overflow-hidden shrink-0 bg-gray-100 border border-[#E7E7E8]">
              {userData.profileImage ? (
                <img src={userData.profileImage} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#009D77] to-[#017A5D] flex items-center justify-center">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#011813] tracking-tight">
                {getGreeting()}, {userData.name.split(' ')[0]}
              </h2>
              <p className="text-sm text-[#475467] font-medium mt-0.5">
                Targeting <span className="text-[#011813] font-semibold capitalize">{userData.targetRole}</span> roles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto bg-[#F8F9FA] lg:bg-transparent p-4 lg:p-0 rounded-xl border border-[#E7E7E8] lg:border-none">
            <div className="flex flex-col lg:items-end w-full">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#011813]">
                <div className={`w-2 h-2 rounded-full ${stats.detectedSkillsCount > 0 ? 'bg-[#009D77]' : 'bg-[#F59E0B]'}`}></div>
                {stats.detectedSkillsCount > 0 ? "Profile Active" : "Getting Started"}
              </div>
              <p className="text-xs text-[#475467] mt-1 font-medium">
                {stats.detectedSkillsCount > 0 ? `${stats.detectedSkillsCount} skills detected from resume` : "Resume not uploaded"}
              </p>
            </div>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="bg-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Primary Score */}
            <div className="flex-shrink-0 flex flex-col justify-center items-center bg-[#011813] rounded-2xl p-6 text-white w-full md:w-[220px] shadow-sm relative overflow-hidden">
              {/* decorative backdrop */}
              <div className="absolute top-0 right-0 opacity-[0.03] scale-150 -translate-y-4 translate-x-4">
                <Target className="w-48 h-48" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.6)] mb-2 text-center">
                  Readiness Score
                </span>
                <div className="text-5xl font-extrabold tracking-tight leading-none mb-4 flex items-baseline">
                  {stats.readinessScore}
                  <span className="text-xl text-[rgba(255,255,255,0.4)] ml-1">/100</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${stats.readinessScore > 75 ? "bg-[#009D77]/20 text-[#2EEAAB]" : stats.readinessScore > 40 ? "bg-[#F59E0B]/20 text-[#FBCC14]" : "bg-red-500/20 text-red-400"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${stats.readinessScore > 75 ? "bg-[#2EEAAB]" : stats.readinessScore > 40 ? "bg-[#FBCC14]" : "bg-red-400"}`}></div>
                  {stats.readinessScore > 75 ? "Excellent Match" : stats.readinessScore > 40 ? "Getting there" : "Need to work"}
                </span>
              </div>
            </div>

            {/* Sub Metrics */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 h-full">

                <div className="bg-[#F8F9FA] border border-[#E7E7E8] rounded-2xl p-4 md:p-5 flex flex-col relative overflow-hidden group hover:border-[#D0D5DD] transition-colors">
                  <div className="absolute top-3 right-3 text-[#E7E7E8] group-hover:text-[#009D77]/20 transition-colors">
                    <BookOpen className="w-10 md:w-12 h-10 md:h-12" />
                  </div>
                  <div className="flex items-center gap-2 mb-auto z-10">
                    <div className="w-6 h-6 rounded-md bg-white border border-[#E7E7E8] flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-[#011813]" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-[#475467]">Skills</span>
                  </div>
                  <div className="mt-4 md:mt-6 z-10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-extrabold text-[#011813]">{stats.skillsScore}</span>
                      <span className="text-xs md:text-sm font-semibold text-[#475467]">/ 100</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-[#475467] font-medium mt-1">Depth analysis</p>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] border border-[#E7E7E8] rounded-2xl p-4 md:p-5 flex flex-col relative overflow-hidden group hover:border-[#D0D5DD] transition-colors">
                  <div className="absolute top-3 right-3 text-[#E7E7E8] group-hover:text-[#009D77]/20 transition-colors">
                    <Briefcase className="w-10 md:w-12 h-10 md:h-12" />
                  </div>
                  <div className="flex items-center gap-2 mb-auto z-10">
                    <div className="w-6 h-6 rounded-md bg-white border border-[#E7E7E8] flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5 text-[#011813]" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-[#475467]">Interview</span>
                  </div>
                  <div className="mt-4 md:mt-6 z-10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-extrabold text-[#011813]">{stats.interviewScore}</span>
                      <span className="text-xs md:text-sm font-semibold text-[#475467]">/ 100</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-[#475467] font-medium mt-1">Mock average</p>
                  </div>
                </div>

                <div className="bg-[#F8F9FA] border border-[#E7E7E8] rounded-2xl p-4 md:p-5 flex flex-col relative overflow-hidden group hover:border-[#D0D5DD] transition-colors">
                  <div className="absolute top-3 right-3 text-[#E7E7E8] group-hover:text-[#009D77]/20 transition-colors">
                    <Target className="w-10 md:w-12 h-10 md:h-12" />
                  </div>
                  <div className="flex items-center gap-2 mb-auto z-10">
                    <div className="w-6 h-6 rounded-md bg-white border border-[#E7E7E8] flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-[#011813]" />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-[#475467]">Roadmap</span>
                  </div>
                  <div className="mt-4 md:mt-6 z-10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-extrabold text-[#011813]">{stats.roadmapScore}</span>
                      <span className="text-xs md:text-sm font-semibold text-[#475467]">/ 100</span>
                    </div>
                    <p className="text-[10px] md:text-xs text-[#475467] font-medium mt-1">Completion progress</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Matches */}
          <div className="bg-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#011813]">Top Matches</h3>
              <Link to="/company" className="text-xs font-bold text-[#009D77] hover:underline">View all</Link>
            </div>
            <div className="space-y-5 flex-1">
              {stats.topMatches.length > 0 ? stats.topMatches.map((company) => (
                <div key={company.name} className="flex items-center gap-4 group">
                  <div className="w-28 text-sm font-semibold text-[#011813] shrink-0 truncate">
                    {company.name}
                  </div>
                  <div className="flex-1 h-2 bg-[#F0F2F5] rounded-full overflow-hidden min-w-0">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${company.score}%` }}
                      transition={{ duration: 1, delay: 0.35 }}
                      className={`h-full rounded-full ${company.strong ? "bg-[#EC4899]" : "bg-[#F472B6]"
                        }`}
                    />
                  </div>
                  <div
                    className={`w-10 text-right text-sm font-extrabold shrink-0 ${company.strong ? "text-[#EC4899]" : "text-[#F472B6]"
                      }`}
                  >
                    {company.score}%
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="w-12 h-12 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-3">
                    <Briefcase className="w-6 h-6 text-[#98A2B3]" />
                  </div>
                  <p className="text-sm font-medium text-[#011813] mb-1">No matches found</p>
                  <p className="text-xs text-[#475467]">Upload a resume and take quizzes to find matching roles.</p>
                </div>
              )}
            </div>
          </div>



        {/* Next Recommendation & Progression */}
          {/* Next Step Banner */}
          <div className="bg-[#011813] border border-[#011813] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center overflow-hidden relative gap-6">
            <div className="absolute top-0 right-[-10%] p-8 opacity-10 pointer-events-none hidden md:block">
              <Brain className="w-40 h-40 text-white" />
            </div>
            <div className="relative z-10 flex flex-col flex-1">
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#009D77] mb-2">
                Next Recommendation
              </h3>
              <div className="mb-4">
                <h4 className="text-xl md:text-2xl font-extrabold text-white mb-2 leading-tight">
                  {stats.nextStep.title}
                </h4>
                <p className="text-sm text-[rgba(255,255,255,0.7)] leading-relaxed max-w-lg">
                  {stats.nextStep.desc}
                </p>
              </div>
            </div>
            <Link
              to={stats.nextStep.link}
              className="relative z-10 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#009D77] text-white text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-[#008a68] transition-all active:scale-[0.98] shadow-lg shadow-[#009D77]/20"
            >
              Proceed Now
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Bottom insights row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Score History */}
          <div className="bg-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-bold text-[#011813]">Score Progression</h3>
              <span className="text-[10px] font-semibold text-[#475467] bg-[#F8F9FA] py-1 px-2.5 rounded-md uppercase tracking-wider">Historical Trend</span>
            </div>
            <div className="h-40 flex items-end justify-between gap-2 sm:gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar-md">
              {(stats.historyBars || []).map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 min-w-[36px] h-full justify-end group">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: bar.height }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`w-full max-w-[2.5rem] rounded-t-lg transition-colors duration-200 ${bar.active
                        ? "bg-[#009D77] opacity-80 group-hover:opacity-100"
                        : "bg-[#F0F2F5]"
                      }`}
                  />
                  <div className={`mt-3 text-[9px] font-bold whitespace-nowrap uppercase tracking-tighter ${bar.active ? "text-[#475467]" : "text-[#98A2B3]"}`}>
                    {bar.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tip */}
          <div className="bg-gradient-to-b from-[#E8FAF5] to-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative lg:col-span-1">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E7E7E8] flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-[#009D77]" />
            </div>
            <h2 className="text-base font-bold text-[#011813] mb-2 tracking-tight">
              Placement Insight
            </h2>
            <p className="text-sm text-[#475467] leading-relaxed">
              {stats.readinessScore > 75
                ? `You're in the top percentile. Keep practicing mock interviews.`
                : stats.readinessScore > 40
                  ? `You have a solid foundation. Follow your roadmap to boost readiness.`
                  : `Start your journey by completing quizzes and building your roadmap.`}
            </p>
          </div>

          {/* View Quiz Section */}
          <div className="bg-gradient-to-b from-[#FFF0F6] to-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm flex flex-col justify-center text-center relative lg:col-span-1 group">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E7E7E8] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-[#EC4899]" />
            </div>
            <h2 className="text-base font-bold text-[#011813] mb-2 tracking-tight">
              Assessments
            </h2>
            <p className="text-sm text-[#475467] leading-relaxed mb-6">
              Test your knowledge, review past mistakes, and improve your skills.
            </p>
            <Link to="/quiz" className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#EC4899] border border-[#EC4899] py-2 px-4 rounded-xl hover:bg-[#DB2777] transition-colors shadow-sm">
              View Quizzes
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
