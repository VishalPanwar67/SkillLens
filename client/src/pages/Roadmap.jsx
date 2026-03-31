import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Activity, Flag, Plus, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import RoadmapModal from './RoadmapModal';

export default function Roadmap() {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [track, setTrack] = useState("Developer Track");
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5800/api/auth/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result.data?.user) {
        setHasResume(!!result.data.user.detectedSkills && result.data.user.detectedSkills.length > 0);
      }
    } catch (err) {
      console.error("Profile fetch error", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5800/api/roadmap", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok && result?.success && result.data?.weeks) {
        setWeeks(result.data.weeks);
        setTrack(result.data.targetRole || "Developer");
      } else {
        setWeeks([]);
        setError(result?.message || "Failed to load roadmap");
      }
    } catch (err) {
      setError("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('generateFor');
    const shouldGenerate = params.get('generate');
    if (companyId) {
      generateRoadmap(companyId);
    } else if (shouldGenerate === 'true') {
      generateRoadmap();
    } else {
      fetchRoadmap();
    }
  }, []);

  const generateRoadmap = async (targetCompanyId = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5800/api/roadmap/generate", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetCompanyId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // Clear search params after generating
        window.history.replaceState({}, '', window.location.pathname);
        fetchRoadmap();
      } else {
        setError(result.message || "Failed to generate roadmap");
      }
    } catch (err) {
      setError("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (weekNumber, taskId, done) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5800/api/roadmap/${weekNumber}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ done })
      });
      fetchRoadmap();
    } catch (err) {
       console.error(err);
    }
  };

  const handleToggleWeek = async (weekNumber, done) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5800/api/roadmap/${weekNumber}/complete`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ done })
      });
      fetchRoadmap();
    } catch (err) {
       console.error(err);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#fbfbfa] relative overflow-hidden flex flex-col pt-4 pb-12 px-6">
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-40">
           <div className="absolute top-[20%] left-[20%] w-[40%] h-[50%] bg-[#d2fbf0] rounded-full blur-[140px]" />
           <div className="absolute bottom-[0%] right-[10%] w-[30%] h-[30%] bg-[#fae8fb] rounded-full blur-[120px]" />
        </div>

        <main className="flex-1 w-full max-w-4xl mx-auto relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end mb-8 border-b border-gray-100 pb-10">
             <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-5xl font-black text-[#0b261d] tracking-tight">Growth Path</h1>
                  <span className="px-3 py-1 bg-[#11b589] text-white rounded-xl text-xs font-black tracking-widest uppercase shadow-lg shadow-[#11b589]/20">{track}</span>
                </div>
                <p className="text-[#3b4b45]/60 font-medium text-lg max-w-xl">
                  Your personalized 8-week journey to developer fluency, optimized for your target companies.
                </p>
             </div>
             <div className="hidden md:flex flex-col items-end gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Completion</span>
                <span className="text-2xl font-black text-[#0b261d]">Aug 15</span>
             </div>
          </motion.div>

          {loading || profileLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
               <Loader2 className="w-12 h-12 animate-spin text-[#11b589] mb-4" />
               <p className="text-[#3b4b45]/60 font-bold uppercase tracking-widest text-[10px]">Analyzing your growth path...</p>
            </div>
          ) : !hasResume ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border-2 border-dashed border-[#009D77]/20 rounded-[3rem] p-16 text-center shadow-2xl shadow-[#11b589]/5">
               <div className="w-24 h-24 bg-[#E8FAF5] rounded-full flex items-center justify-center mx-auto mb-8 text-[#009D77]">
                  <Plus className="w-10 h-10" />
               </div>
               <h3 className="text-3xl font-black text-[#0b261d] mb-4">Step 1: Upload Your Resume</h3>
               <p className="text-[#3b4b45]/60 font-medium mb-10 max-w-sm mx-auto">
                  We need to know your current skill level before we can build your personalized roadmap.
               </p>
               <a 
                 href="/resume" 
                 className="inline-flex items-center gap-3 px-10 py-4 bg-[#011813] text-white rounded-2xl font-black hover:bg-[#11b589] transition-all hover:scale-[1.02] active:scale-[0.98]"
               >
                 Go to Upload Page <ChevronRight className="w-5 h-5" />
               </a>
            </motion.div>
          ) : weeks.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 rounded-[3rem] p-16 text-center shadow-2xl shadow-gray-200/50">
               <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 text-orange-500">
                  <Flag className="w-10 h-10" />
               </div>
               <h3 className="text-3xl font-black text-[#0b261d] mb-4">Step 2: Generate Growth Path</h3>
               <p className="text-[#3b4b45]/60 font-medium mb-10 max-w-sm mx-auto">
                  Your resume is ready! Now let's calculate the perfect 8-week journey for your career goals.
               </p>
               <button 
                 onClick={() => generateRoadmap()}
                 className="inline-flex items-center gap-3 px-10 py-4 bg-[#11b589] text-white rounded-2xl font-black hover:bg-[#0b261d] transition-all hover:scale-[1.02] active:scale-[0.98]"
               >
                 Generate My Roadmap <Activity className="w-5 h-5" />
               </button>
            </motion.div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
             {weeks.map((week, idx) => {
                const isActive = !week.done && (idx === 0 || weeks[idx-1].done);
                const isLocked = !week.done && !isActive;
                const completionRate = Math.round((week.tasks.filter(t => t.done).length / week.tasks.length) * 100);

                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => !isLocked && setSelectedWeekIdx(idx)}
                    className={`relative overflow-hidden group cursor-pointer h-full min-h-[160px] flex flex-col p-6 rounded-[2rem] transition-all duration-300 border ${
                       week.done ? 'bg-white border-[#009D77]/20 shadow-lg shadow-[#009D77]/5' : 
                       isActive ? 'bg-[#011813] border-[#009D77] shadow-2xl shadow-[#009D77]/20 scale-[1.02]' : 
                       'bg-white border-gray-100 opacity-60 hover:opacity-100 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Background Accents */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#009D77]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-white/50' : 'text-gray-400'}`}>Week {week.weekNumber}</span>
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          week.done ? 'bg-[#009D77] text-white shadow-lg shadow-[#009D77]/30' : 
                          isActive ? 'bg-[#EA4C89] text-white animate-pulse' : 
                          'bg-gray-100 text-gray-400'
                       }`}>
                          {week.done ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Activity className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                       </div>
                    </div>

                    <h3 className={`text-sm font-black mb-3 leading-tight uppercase tracking-tight relative z-10 ${isActive ? 'text-white' : 'text-[#011813]'}`}>
                       {week.theme}
                    </h3>
                    
                    <div className="mt-auto space-y-3 relative z-10">
                       {!isLocked && (
                         <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                               <span className={isActive ? 'text-white/40' : 'text-gray-400'}>Progress</span>
                               <span className={isActive ? 'text-[#009D77]' : 'text-[#009D77]'}>{completionRate}%</span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-white/10' : 'bg-gray-100'}`}>
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${completionRate}%` }}
                                 className="h-full bg-gradient-to-r from-[#009D77] to-[#2EEAAB]"
                               />
                            </div>
                         </div>
                       )}
                       
                       <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                             week.done ? 'text-[#009D77]' : 
                             isActive ? 'text-[#EA4C89]' : 
                             'text-gray-400'
                          }`}>
                             {week.done ? 'Mastered' : isActive ? 'Current' : 'Upcoming'}
                          </span>
                          {!isLocked && week.tasks.length > 0 && (
                            <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-300'}`} />
                          )}
                          {!isLocked && week.tasks.length > 0 && (
                            <span className={`text-[8px] font-bold ${isActive ? 'text-white/40' : 'text-gray-400'}`}>
                               {week.tasks.length} Points
                            </span>
                          )}
                       </div>
                    </div>

                    {isActive && (
                      <div className="absolute bottom-4 right-4 animate-bounce">
                         <ChevronRight className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </motion.div>
                );
             })}
          </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {selectedWeekIdx !== null && (
          <RoadmapModal 
            isOpen={true} 
            onClose={() => setSelectedWeekIdx(null)}
            week={weeks[selectedWeekIdx]}
            onToggleTask={handleToggleTask}
          />
        )}
      </AnimatePresence>
    </>
  );
}
