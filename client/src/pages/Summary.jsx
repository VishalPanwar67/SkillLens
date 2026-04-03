import React from 'react';
import { apiUrl } from '../config/api';
import { motion } from 'framer-motion';
import { Target, Zap, TrendingUp, CheckCircle, Flame, Star, Award, ShieldAlert, MessageSquare, Cpu, Loader2 } from 'lucide-react';

export default function Summary() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl('/api/quiz/stats'), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const feedbackItems = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('interview_feedback') || '[]');
    } catch { return []; }
  }, []);

  const avgRating = feedbackItems.length > 0 
    ? (feedbackItems.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbackItems.length).toFixed(1) 
    : 0;

  if (loading) {
     return (
       <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#11b589]" />
       </div>
     );
  }

  const cards = [
    { title: 'Learning Streak', value: `${stats?.learningStreak || 0} Days`, icon: Flame, color: 'text-[#EC4899]', bg: 'bg-[#FDF2F8]' },
    { title: 'Quizzes Passed', value: stats?.totalAttempts || 0, icon: CheckCircle, color: 'text-[#009D77]', bg: 'bg-[#E8FAF5]' },
    { title: 'Global Score', value: `${stats?.avgScore || 0}%`, icon: TrophyIcon, color: 'text-[#EC4899]', bg: 'bg-[#FDF2F8]' },
    { title: 'Skill Footprint', value: `${stats?.uniqueSkills || 0} Skills`, icon: Target, color: 'text-[#009D77]', bg: 'bg-[#E8FAF5]' }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pb-12 px-4 sm:px-6">
        <main className="w-full max-w-6xl mx-auto flex flex-col gap-4 relative z-10 pt-4">
          
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-white border border-[#E7E7E8] rounded-2xl p-5 shadow-sm shrink-0">
             <div>
               <h1 className="text-xl font-extrabold text-[#011813] tracking-tight flex items-center gap-2">
                 <Zap className="w-5 h-5 text-[#009D77]" /> Interview & Analytics Summary
               </h1>
               <p className="text-xs font-semibold text-[#475467] mt-0.5">
                 Dynamically generated insights based on your recent activity and evaluations.
               </p>
             </div>
             <div className="hidden md:flex items-center gap-3">
               <span className="px-3 py-1 bg-[#E8FAF5] text-[#009D77] rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[rgba(0,157,119,0.12)]">AI Assessed</span>
             </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Sidebar: Core Stats & Overview */}
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="lg:w-[35%] flex flex-col gap-4"
            >
              {/* Overall AI Score Card */}
              <div className="bg-[#011813] border border-[#011813] rounded-2xl p-6 shadow-sm relative overflow-hidden shrink-0">
                 <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                    <Target className="w-32 h-32 text-white" />
                 </div>
                 <div className="relative z-10 flex flex-col h-full justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#009D77] mb-4">
                      Interview Performance
                    </h3>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-5xl font-extrabold text-white tracking-tight">{avgRating}</span>
                      <span className="text-sm font-semibold text-[rgba(255,255,255,0.4)]">/ 5.0</span>
                    </div>
                    <p className="text-xs text-[rgba(255,255,255,0.7)] font-medium leading-relaxed">
                      Average AI rating based on your technical vocabulary and problem-solving formatting.
                    </p>
                 </div>
              </div>

              {/* Dynamic Stats Grid */}
              <div className="bg-white border border-[#E7E7E8] rounded-2xl p-5 shadow-sm flex-1 grid grid-cols-2 gap-3 overflow-y-auto">
                 {cards.map((stat, i) => (
                    <div 
                       key={i}
                       className="bg-[#F8F9FA] border border-[#E7E7E8] rounded-xl p-4 flex flex-col justify-center items-center text-center hover:border-[#D0D5DD] transition-all group"
                    >
                       <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E7E8] flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                          <stat.icon className={`w-4 h-4 ${stat.color.replace('text-blue-500', 'text-[#009D77]').replace('text-emerald-500', 'text-[#009D77]').replace('text-yellow-600', 'text-[#EC4899]').replace('text-orange-500', 'text-[#EC4899]')}`} />
                       </div>
                       <h3 className="text-sm font-extrabold text-[#011813] mb-0.5">{stat.value}</h3>
                       <p className="text-[9px] font-bold text-[#475467] uppercase tracking-wider">{stat.title}</p>
                    </div>
                 ))}
                 
                 {/* Feedback Items Count */}
                 <div className="col-span-2 bg-gradient-to-r from-[#E8FAF5] to-white border border-[#E7E7E8] rounded-xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-white border border-[rgba(0,157,119,0.12)] flex items-center justify-center shadow-sm">
                        <MessageSquare className="w-4 h-4 text-[#009D77]" />
                     </div>
                     <div>
                       <h3 className="text-xs font-bold text-[#011813]">Questions Checked</h3>
                       <p className="text-[10px] text-[#475467] font-medium">Logged in this session</p>
                     </div>
                   </div>
                   <span className="text-lg font-extrabold text-[#009D77]">{feedbackItems.length}</span>
                 </div>
              </div>
            </motion.div>

            {/* Right Panel: Detailed Feedback Scroll */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="lg:w-[65%] bg-white border border-[#E7E7E8] rounded-2xl shadow-sm flex flex-col overflow-hidden"
            >
                <div className="p-5 border-b border-[#E7E7E8] bg-[#F8F9FA] shrink-0">
                   <h3 className="text-sm font-extrabold text-[#011813] flex items-center gap-2">
                     <Cpu className="w-4 h-4 text-[#009D77]" /> Detailed AI Transcripts
                   </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#F8F9FA]">
                   <div className="flex flex-col gap-4">
                     {feedbackItems.length > 0 ? (
                       feedbackItems.map((item, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-white border border-[#E7E7E8] shadow-sm flex flex-col gap-4 group hover:border-[#009D77]/30 transition-colors">
                             
                             <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[9px] font-bold text-[#98A2B3] uppercase tracking-wider mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-[#EC4899]"/> Question {idx + 1}</p>
                                  <h4 className="text-[#011813] font-bold text-sm leading-snug">"{item.question}"</h4>
                                </div>
                                <div className="flex gap-0.5 bg-[#F8F9FA] px-2 py-1.5 rounded-md border border-[#E7E7E8]">
                                   {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-3 h-3 ${i < item.rating ? 'text-[#009D77] fill-[#009D77]' : 'text-[#E7E7E8]'}`} />
                                   ))}
                                </div>
                             </div>
                             
                             <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E7E7E8] italic text-[#475467] text-xs">
                                <span className="block text-[9px] font-bold text-[#475467] uppercase tracking-wider mb-1.5 not-italic">Your Answer:</span>
                                "{item.answer || "No response recorded."}"
                             </div>
                             
                             <div className="flex flex-col md:flex-row gap-3">
                               <div className="flex-1 bg-white p-3.5 rounded-xl border border-[#E7E7E8] text-[#011813] text-xs font-medium">
                                  <span className="block text-[9px] font-bold text-[#EC4899] uppercase tracking-wider mb-1.5">Expected Ideal:</span>
                                  {item.ideal}
                               </div>

                               <div className="flex-1 bg-[#E8FAF5] border border-[rgba(0,157,119,0.12)] p-3.5 rounded-xl text-xs font-medium">
                                  <span className="block text-[9px] font-bold text-[#009D77] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> Improvement Plan
                                  </span>
                                  <span className="text-[#011813] leading-relaxed">{item.critique || item.improvement || '—'}</span>
                               </div>
                             </div>
                          </div>
                       ))
                     ) : (
                       <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#E7E7E8] border-dashed rounded-2xl h-full">
                          <div className="w-16 h-16 bg-[#F8F9FA] rounded-full border border-[#E7E7E8] flex items-center justify-center mb-4">
                            <Cpu className="w-8 h-8 text-[#98A2B3]" />
                          </div>
                          <p className="font-bold text-[#011813] mb-1">No feedback recorded yet</p>
                          <p className="text-xs text-[#475467]">Complete an AI interview session to see detailed evaluations.</p>
                       </div>
                     )}
                   </div>
                </div>
            </motion.div>
          </div>
        </main>
    </div>
  );
}

// Inline fallback icon to prevent import errors if not found
function TrophyIcon(props) {
  return <Award {...props} />;
}
