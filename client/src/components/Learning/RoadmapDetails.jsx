import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Youtube, 
  Code, 
  HelpCircle, 
  CheckCircle2, 
  ChevronDown,
  PlayCircle,
  ExternalLink,
  Target,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MessageSquare
} from "lucide-react";

export default function RoadmapDetails({ skill, onComplete }) {
  const [activeTab, setActiveTab] = useState("roadmap");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [hasBrokenLinks, setHasBrokenLinks] = useState(false);
  const [showFixPopup, setShowFixPopup] = useState(false);

  useEffect(() => {
    fetchRoadmap();
  }, [skill]);

  useEffect(() => {
    if (hasBrokenLinks) {
       setShowFixPopup(true);
    }
  }, [hasBrokenLinks]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      const res = await fetch(`http://localhost:5800/api/skill-roadmap?skill=${skill.id}`, { headers });
      
      if (!res.ok) throw new Error("Failed to fetch roadmap.");
      
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = async (stepId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      const res = await fetch(`http://localhost:5800/api/skill-roadmap/progress`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({ skill: skill.id, stepId, done: !currentStatus })
      });

      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (err) {
       console.error("Scale progress error:", err);
    }
  };

  const toggleProjectStatus = async (projectId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      const res = await fetch(`http://localhost:5800/api/skill-roadmap/project-progress`, { 
        method: 'POST',
        headers,
        body: JSON.stringify({ skill: skill.id, projectId, done: !currentStatus })
      });
 
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
      }
    } catch (err) {
       console.error("Project status toggle error:", err);
    }
  };

  const handleSelect = (qIdx, opt) => {
    setUserAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState message={error} />;

  const tabs = [
    { id: "roadmap", label: "Learning Path", icon: BookOpen },
    { id: "videos", label: "Tutorials", icon: Youtube },
    { id: "projects", label: "Projects", icon: Code },
    { id: "practice", label: "Practice", icon: HelpCircle },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative">
      <AnimatePresence>
        {showFixPopup && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed bottom-10 right-10 z-[110] w-80 bg-[#011813] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50 text-white">
             <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-[#009D77] rounded-full flex items-center justify-center">
                   <Youtube className="w-5 h-5 text-white" />
                </div>
                <button onClick={() => setShowFixPopup(false)} className="text-white/40 hover:text-white">&times;</button>
             </div>
             <h4 className="text-sm font-black uppercase tracking-widest mb-2">Content Repair</h4>
             <p className="text-xs text-white/60 mb-6 leading-relaxed">It looks like some tutorials are currently unavailable. Launching a smart search is recommended.</p>
             <a 
               href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name + " full tutorial roadmap")}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-full flex items-center justify-center gap-2 bg-[#009D77] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
             >
                Search on YouTube <ArrowUpRight className="w-3.5 h-3.5" />
             </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Tabs - Compact */}
      <div className="lg:col-span-3 space-y-3">
        <div className="bg-white border border-[#E7E7E8] rounded-2xl p-3 shadow-sm sticky top-24">
          <div className="flex flex-col gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                  ? "bg-[#009D77] text-white shadow-lg shadow-[#009D77]/20" 
                  : "bg-white text-[#475467] hover:bg-[#F8F9FA]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-[#E7E7E8]">
             <div className="mb-3 px-1">
               <div className="flex justify-between text-[8px] font-black text-[#475467] mb-1.5 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{data.overallProgress}%</span>
               </div>
               <div className="h-1.5 bg-[#f0f1f2] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.overallProgress}%` }}
                    className="h-full bg-gradient-to-r from-[#009D77] to-[#2EEAAB]"
                  />
               </div>
             </div>
             {data.overallProgress === 100 && (
               <button 
                onClick={onComplete}
                className="w-full bg-[#011813] text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
               >
                 <Target className="w-3.5 h-3.5" /> Claim Medal
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Main Content - High Density */}
      <div className="lg:col-span-9">
        <AnimatePresence mode="wait">
          {activeTab === "roadmap" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key="tab-roadmap"
              className="space-y-4"
            >
              <div className="bg-white border border-[#E7E7E8] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                   <h2 className="text-xl font-black text-[#011813] tracking-tight uppercase">Learning Path: {skill.name}</h2>
                   <div className="w-8 h-8 rounded-full bg-[#E8FAF5] flex items-center justify-center text-[#009D77]">
                      <TrendingUp className="w-4 h-4" />
                   </div>
                </div>
                <div className="space-y-4 relative">
                   {/* Vertical Line */}
                   <div className="absolute top-0 bottom-0 left-[19px] w-[2px] bg-[#E7E7E8] z-0 hidden sm:block"></div>
                   
                   {data.steps.map((step, idx) => (
                      <div key={idx} className="relative z-10 flex gap-4 sm:gap-6 group">
                         {/* Step Circle - Compact */}
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                            step.done 
                            ? "bg-[#009D77] border-[#009D77] text-white shadow-lg shadow-[#009D77]/30" 
                            : "bg-white border-[#E7E7E8] text-[#475467]"
                         }`}>
                            {step.done ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                         </div>

                         {/* Step Content - Compact */}
                         <div className={`flex-1 p-3 rounded-xl border border-[#E7E7E8] transition-all ${
                            step.done ? "bg-[#E8FAF5]/10 border-[#009D77]/20" : "bg-[#F8F9FA]/50"
                         }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                               <h3 className={`text-sm font-black uppercase tracking-tight ${step.done ? "text-[#009D77] opacity-60 line-through" : "text-[#011813]"}`}>
                                 {step.title}
                               </h3>
                               <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1.5 text-[9px] font-black text-[#475467] uppercase tracking-widest">
                                     <Clock className="w-3.5 h-3.5" /> {step.estimatedTime}
                                  </span>
                                  <button 
                                    onClick={() => toggleStep(step.id, step.done)}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${step.done ? 'bg-[#011813] text-white' : 'bg-[#009D77] text-white hover:bg-[#008a68]'}`}
                                  >
                                    {step.done ? 'Undo' : 'Mark Done'}
                                  </button>
                               </div>
                            </div>
                            <p className="text-sm text-[#475467] leading-relaxed mb-6">{step.description}</p>
                            
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-dashed border-[#E7E7E8]">
                               <a href={step.docLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-black text-[#475467] hover:text-[#009D77] uppercase tracking-wider">
                                  Official Docs <ArrowUpRight className="w-3.5 h-3.5" />
                               </a>
                               <div className="flex items-center gap-2 text-xs font-black text-[#475467] uppercase tracking-wider bg-[#F8F9FA] px-3 py-1 rounded-lg">
                                  <Code className="w-3.5 h-3.5" /> {step.projectIdea}
                               </div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "videos" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="tab-videos"
              className={data.videos && data.videos.length > 0 ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "block"}
            >
              {data.videos && data.videos.length > 0 ? (
                data.videos.map((vid, idx) => (
                  <div key={idx} className="bg-white border border-[#E7E7E8] rounded-3xl overflow-hidden shadow-sm group hover:border-[#009D77] transition-all duration-300">
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={vid.thumbnail} 
                          alt={vid.title} 
                          onError={(e) => {
                              setHasBrokenLinks(true);
                              e.target.src = `https://img.youtube.com/vi/${vid.videoId}/0.jpg`;
                              e.target.onerror = (evt) => {
                                evt.target.src = "https://placehold.co/600x400/011813/white?text=No+Thumbnail";
                              };
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <PlayCircle className="w-16 h-16 text-white" />
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <h3 className="text-sm font-black text-[#011813] leading-tight group-hover:text-[#009D77] transition-colors">{vid.title}</h3>
                            <a href={`https://youtube.com/watch?v=${vid.videoId}`} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 bg-[#F8F9FA] rounded-xl hover:bg-[#E8FAF5] transition-colors">
                              <ExternalLink className="w-4 h-4 text-[#475467]" />
                            </a>
                        </div>
                        <p className="text-[10px] font-bold text-[#475467] uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" /> {vid.channelName}
                        </p>
                      </div>
                      <div className="px-6 pb-6 mt-auto">
                        <a href={`https://youtube.com/watch?v=${vid.videoId}`} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-[#011813] text-white py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#009D77] transition-all">
                            Watch on YouTube
                        </a>
                      </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-[#E7E7E8] rounded-[2.5rem] p-12 text-center max-w-lg mx-auto overflow-hidden relative group">
                   <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#009D77]/5 rounded-full blur-3xl group-hover:bg-[#009D77]/10 transition-all" />
                   <div className="w-20 h-20 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                      <Youtube className="w-10 h-10 text-[#009D77]" />
                   </div>
                   <h3 className="text-xl font-black text-[#011813] mb-3 uppercase tracking-tight">Expand Your Library</h3>
                   <p className="text-sm text-[#475467] leading-relaxed mb-8 font-medium">
                      We're currently sourcing the sharpest <span className="text-[#011813] font-bold uppercase">{skill.name}</span> tutorials for you. In the meantime, launch a direct search.
                   </p>
                   <a 
                     href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name + " complete tutorial roadmap")}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-3 bg-[#009D77] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#011813] transition-all shadow-xl shadow-[#009D77]/20"
                   >
                     Search YouTube Directly <ArrowUpRight className="w-4 h-4" />
                   </a>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "projects" && (
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key="tab-projects"
               className="space-y-6"
            >
               {data.projects.length === 0 && (
                 <div className="text-center py-12 bg-white border rounded-3xl">
                   <Code className="w-12 h-12 text-[#98A2B3] mx-auto mb-4" />
                   <p className="text-sm font-bold text-[#475467]">No projects suggested yet. Start learning to unlock some!</p>
                 </div>
               )}
               <div className="space-y-6">
                  {data.projects.length === 0 && (
                    <div className="text-center py-12 bg-white border rounded-3xl">
                      <Code className="w-12 h-12 text-[#98A2B3] mx-auto mb-4" />
                      <p className="text-sm font-bold text-[#475467]">No projects suggested yet. Start learning to unlock some!</p>
                    </div>
                  )}
                  {data.projects.map((proj, idx) => {
                     const isUnlocked = idx === 0 || data.projects[idx - 1].done;
                     const isDone = proj.done;
                     
                     return (
                        <div key={idx} className={`bg-white border rounded-3xl p-8 shadow-sm transition-all duration-300 relative overflow-hidden group ${
                           isDone ? 'border-[#009D77]/40 bg-[#E8FAF5]/10' : 
                           isUnlocked ? 'border-[#E7E7E8] hover:border-[#EC4899]' : 
                           'border-[#E7E7E8] opacity-50'
                        }`}>
                           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300">
                              <Code className={`w-48 h-48 ${isDone ? 'text-[#009D77]' : 'text-[#EC4899]'}`} />
                           </div>
                           <div className="relative z-10">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                 <div>
                                    <div className="flex items-center gap-2 mb-2">
                                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${
                                          proj.difficulty === 'Beginner' ? 'bg-[#E8FAF5] text-[#009D77]' : 
                                          proj.difficulty === 'Intermediate' ? 'bg-[#FFF0F6] text-[#EC4899]' : 
                                          'bg-[#FEF3F2] text-red-600'
                                       }`}>
                                          {proj.difficulty}
                                       </span>
                                       {isDone && <span className="bg-[#E8FAF5] text-[#009D77] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Completed</span>}
                                       {!isUnlocked && <span className="bg-[#F8F9FA] text-[#475467] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Locked</span>}
                                    </div>
                                    <h3 className={`text-xl font-black uppercase tracking-tight ${isDone ? 'text-[#011813] opacity-60' : 'text-[#011813]'}`}>{proj.title}</h3>
                                 </div>
                                 <div className="flex gap-2">
                                    {isUnlocked && (
                                       <button 
                                         onClick={() => toggleProjectStatus(proj.id, isDone)}
                                         className={`flex items-center gap-2 font-black text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest transition-all shadow-sm ${
                                            isDone 
                                            ? 'bg-[#011813] text-white' 
                                            : 'bg-[#009D77] text-white hover:bg-[#008a68]'
                                         }`}
                                       >
                                          {isDone ? 'Undo' : 'Mark Done'}
                                       </button>
                                    )}
                                    <button className="flex items-center gap-2 bg-[#F8F9FA] text-[#011813] font-black text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest hover:bg-[#011813] hover:text-white transition-all shadow-sm disabled:opacity-50" disabled={!isUnlocked}>
                                       Build Now <Code className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                              </div>
                              <p className="text-sm text-[#475467] leading-relaxed mb-6 max-w-2xl">{proj.description}</p>
                              <div className="flex items-center gap-3 pt-6 border-t border-[#E7E7E8]">
                                 <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] flex items-center justify-center shrink-0">
                                     <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-[#009D77]' : 'text-[#98A2B3]'}`} />
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-0.5">Key Outcome</p>
                                    <p className="text-sm font-bold text-[#011813]">{proj.outcome}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </motion.div>
          )}

          {activeTab === "practice" && (
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key="tab-practice"
               className="bg-white border border-[#E7E7E8] rounded-3xl p-8 shadow-sm space-y-10"
            >
               <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black text-[#011813]">Practice Questions</h2>
                  <div className="flex items-center gap-2 bg-pink-50 border border-pink-100 px-3 py-1 rounded-lg">
                     <HelpCircle className="w-4 h-4 text-[#EC4899]" />
                     <span className="text-[10px] font-black text-[#EC4899] uppercase tracking-widest">{data.questions.length} Items</span>
                  </div>
               </div>

               {data.questions.map((q, idx) => (
                  <div key={idx} className="space-y-4 pb-8 border-b border-dashed border-[#E7E7E8] last:border-b-0 last:pb-0 group">
                     <div className="flex gap-4">
                        <span className="w-8 h-8 rounded-full bg-[#011813] text-white flex items-center justify-center shrink-0 font-bold text-xs">{idx + 1}</span>
                        <div>
                           <p className="text-sm font-black text-[#475467] uppercase tracking-widest mb-2 flex items-center gap-2">
                              {q.type} Question 
                           </p>
                           <h4 className="text-lg font-bold text-[#011813] leading-relaxed">{q.question}</h4>
                        </div>
                     </div>
                     
                     {q.type === 'MCQ' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-12">
                           {q.options.map((opt, oIdx) => {
                             const isSelected = userAnswers[idx] === opt;
                             const isCorrect = opt === q.answer;
                             const showResult = !!userAnswers[idx];

                             return (
                               <button 
                                 key={oIdx} 
                                 onClick={() => !showResult && handleSelect(idx, opt)}
                                 disabled={showResult}
                                 className={`p-4 border rounded-2xl text-sm font-bold transition-all flex items-center gap-3 text-left ${
                                   isSelected && isCorrect ? 'bg-[#E8FAF5] border-[#009D77] text-[#009D77]' :
                                   isSelected && !isCorrect ? 'bg-red-50 border-red-200 text-red-600' :
                                   showResult && isCorrect ? 'bg-[#E8FAF5] border-[#009D77] text-[#009D77]' :
                                   'bg-white border-[#E7E7E8] text-[#011813] hover:bg-[#F8F9FA]'
                                 }`}
                               >
                                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    isSelected && isCorrect ? 'border-[#009D77] bg-[#009D77] text-white' :
                                    isSelected && !isCorrect ? 'border-red-400 bg-red-400 text-white' :
                                    'border-[#D0D5DD] text-[#475467]'
                                  }`}>
                                    {isSelected && isCorrect ? <CheckCircle2 className="w-3 h-3" /> : 
                                     isSelected && !isCorrect ? "X" :
                                     String.fromCharCode(65 + oIdx)}
                                  </div>
                                  {opt}
                               </button>
                             );
                           })}
                        </div>
                     )}

                     <details className="mt-4 pl-12 group/ans">
                        <summary className="text-[10px] font-black text-[#EC4899] uppercase tracking-[0.2em] cursor-pointer hover:underline list-none flex items-center gap-2">
                           Check Answer <ChevronDown className="w-3 h-3 group-open/ans:rotate-180 transition-transform" />
                        </summary>
                        <div className="mt-4 p-5 bg-[#F8F9FA] rounded-2xl border border-[#E7E7E8]">
                           <p className="text-[10px] font-black text-[#009D77] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                           </p>
                           <p className="text-sm font-bold text-[#011813] italic">{q.answer}</p>
                        </div>
                     </details>
                  </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#E7E7E8] rounded-3xl shadow-sm">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#009D77] mb-4"></div>
      <p className="text-sm font-bold text-[#475467] uppercase tracking-widest">Generating Your Path...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-red-100 rounded-3xl shadow-sm text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
         <Target className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-red-900 mb-2">Roadmap Generation Failed</h3>
      <p className="text-sm text-red-600 mb-6">{message || "Unable to load roadmap data. Please try again."}</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md shadow-red-200"
      >
        Retry Generation
      </button>
    </div>
  );
}
