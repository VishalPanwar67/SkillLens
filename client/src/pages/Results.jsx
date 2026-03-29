import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, XCircle, Clock, ChevronRight, Loader2, ArrowRight, BookOpen, BarChart3, Target, Zap } from 'lucide-react';

export default function Results() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      const url = id 
        ? `http://localhost:5800/api/quiz/attempts/${id}`
        : `http://localhost:5800/api/quiz/attempts/latest`;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setResult(data.data);
        } else {
          setResult(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#fcfdfd] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-[#009D77] mb-4" />
        <p className="text-[#011813] font-bold">Synchronizing results...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-screen bg-[#fcfdfd] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 text-gray-300">
           <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-[#011813] mb-2">No History Found</h2>
        <p className="text-[#475467] font-medium max-w-xs mb-8 text-sm">
           Complete a skill quiz to see your performance metrics and path recommendations.
        </p>
        <button 
           onClick={() => window.location.href = '/quiz'}
           className="px-8 py-3.5 bg-[#011813] text-white rounded-xl font-bold hover:bg-[#009D77] transition-all shadow-lg shadow-[#011813]/10"
        >
           Take First Quiz
        </button>
      </div>
    );
  }

  const resultData = {
    score: result.overallPercent,
    title: result.title,
    time: `${Math.floor(result.timeSpentSeconds / 60)}:${(result.timeSpentSeconds % 60).toString().padStart(2, '0')}`,
    percentile: result.overallPercent > 80 ? "Top 5%" : result.overallPercent > 60 ? "Top 20%" : "Average",
    questions: result.questionReviews.map(r => ({
      q: r.question,
      correct: r.isCorrect
    }))
  };

  return (
    <div className="h-screen bg-[#fcfdfd] overflow-hidden flex flex-col pt-22 pb-6 px-6 lg:px-10 font-sans relative">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 select-none">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#009D77]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#EC4899]/5 rounded-full blur-[100px]" />
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col relative z-10 gap-6 min-h-0">
        
        {/* Header - More breathable */}
        <div className="flex items-center justify-between shrink-0 mb-2">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-50 text-[#009D77] rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
               <Trophy className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-[#011813] leading-tight">Evaluation Report</h1>
                <p className="text-[11px] font-bold text-[#475467] uppercase tracking-wider mt-0.5">
                  Skill Focus: <span className="text-[#009D77] ml-1">{resultData.title}</span>
                </p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-5 py-2.5 bg-white border border-[#E7E7E8] text-[#011813] rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
              >
                 Dashboard <ChevronRight className="w-4 h-4" />
              </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
          
          {/* Left Column: Stats & Recommendations */}
          <div className="lg:col-span-5 flex flex-col gap-5 overflow-hidden">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 shrink-0">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
                   className="bg-white p-5 rounded-3xl border border-[#E7E7E8] text-center shadow-sm relative overflow-hidden">
                   <p className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-2">Score</p>
                   <p className="text-3xl font-black text-[#009D77]">{resultData.score}%</p>
                   <div className="absolute bottom-0 left-0 h-1.5 bg-[#009D77] transition-all" style={{ width: `${resultData.score}%` }} />
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} 
                   className="bg-white p-5 rounded-3xl border border-[#E7E7E8] text-center shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-2">Rank</p>
                   <p className="text-xl font-black text-[#011813]">{resultData.percentile}</p>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
                   className="bg-white p-5 rounded-3xl border border-[#E7E7E8] text-center shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-2">Duration</p>
                   <p className="text-xl font-black text-[#011813]">{resultData.time}</p>
                </motion.div>
            </div>

            {/* Performance Level Card */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
               className="bg-[#011813] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BarChart3 className="w-16 h-16" />
               </div>
               <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#009D77] mb-3">AI Diagnostic</h3>
                  <p className="text-lg font-bold mb-4 leading-tight">
                    {resultData.score > 80 ? "Industry Benchmark Met" : resultData.score > 60 ? "Competitive Baseline" : "Conceptual Gaps Detected"}
                  </p>
                  <p className="text-xs text-[rgba(255,255,255,0.6)] font-medium leading-relaxed max-w-md">
                    Our analyzer suggests focusing on {resultData.score > 80 ? "system architecture and edge cases" : "fundamental patterns and syntax optimization"} to scale your proficiency.
                  </p>
               </div>
            </motion.div>

            {/* Roadmap Quick Action */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
               className="bg-[#E8FAF5] border border-[#BDF1E5] p-6 rounded-3xl shadow-sm flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <Zap className="w-20 h-20 text-[#009D77]" />
               </div>
               <div className="relative z-10 flex flex-col h-full">
                  <h4 className="text-base font-black text-[#011813] mb-2">Syncing Your Path</h4>
                  <p className="text-xs text-[#475467] font-medium leading-[1.6] mb-6">
                     We've personalized your roadmap based on your response patterns. New learning blocks have been prioritized for you.
                  </p>
                  <div className="mt-auto flex gap-3">
                    <button 
                      onClick={() => window.location.href = '/roadmap'}
                      className="flex-1 py-3.5 bg-[#009D77] hover:bg-[#008a68] text-white rounded-2xl text-sm font-black shadow-lg shadow-[#009D77]/20 transition-all flex items-center justify-center gap-2"
                    >
                       View Roadmap <ArrowRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => window.location.href = '/quiz'}
                      className="px-6 py-3.5 bg-white border border-[#BDF1E5] text-[#009D77] rounded-2xl text-sm font-black hover:bg-white/50 transition-all shadow-sm"
                    >
                       Retake
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>

          {/* Right Column: Question Reviews */}
          <div className="lg:col-span-7 flex flex-col gap-3 overflow-hidden h-full">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
               className="bg-white border border-[#E7E7E8] rounded-3xl shadow-sm flex flex-col h-full overflow-hidden"
            >
               <div className="p-5 border-b border-[#F8F9FA] bg-[#F8F9FA] shrink-0 flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#011813] uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#009D77]" /> Question Review
                  </h3>
                  <span className="text-[10px] font-black text-[#475467] bg-white border border-[#E7E7E8] px-3 py-1 rounded-lg">
                    {resultData.questions.length} EVALUATED
                  </span>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                  {resultData.questions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-[#F0F2F5] hover:border-[#009D77]/30 bg-[#fcfdfd] group transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${item.correct ? 'bg-emerald-50 text-[#009D77]' : 'bg-red-50 text-red-500'}`}>
                             {idx + 1}
                          </div>
                          <h4 className="text-[#011813] font-bold text-sm leading-tight line-clamp-1">{item.q}</h4>
                       </div>
                       <div className="flex items-center gap-4 pl-2">
                          {item.correct ? (
                             <span className="flex items-center gap-1.5 text-[#009D77] font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                Pass
                             </span>
                          ) : (
                             <span className="flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                                Fail
                             </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </div>
        </div>
      </main>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E7E7E8; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D0D5DD; }
      `}</style>
    </div>
  );
}
