import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Check, Zap, Loader2, ArrowUpRight } from 'lucide-react';

export default function Match() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { "Authorization": `Bearer ${token}` };
        
        const profRes = await fetch("http://localhost:5800/api/auth/profile", { headers });
        const profData = await profRes.json();
        setTargetRole(profData.data?.user?.targetRole || "fullstack");

        const res = await fetch("http://localhost:5800/api/companies/gaps", { headers });
        const data = await res.json();
        if (data.success && data.data.companies.length > 0) {
           setMatches(data.data.companies.slice(0, 5)); // Get top 5
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [fetchingGap, setFetchingGap] = useState(false);
  const [customText, setCustomText] = useState("");
  const [analyzingCustom, setAnalyzingCustom] = useState(false);

  const handleCustomBenchmark = async () => {
    if (!customText.trim()) return;
    setAnalyzingCustom(true);
    setGapData(null);
    setSelectedCompanyId("custom");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:5800/api/companies/custom-benchmark", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ benchmarkText: customText })
      });
      const data = await res.json();
      if (data.success) {
        setGapData({
          ...data.data,
          about: "AI-parsed custom interview process analysis based on user-provided JD/Process."
        });
      }
    } catch (err) { console.error(err); }
    finally { setAnalyzingCustom(false); }
  };

  const fetchGap = async (id) => {
    setSelectedCompanyId(id);
    setFetchingGap(true);
    setGapData(null);
    try {
      const token = localStorage.getItem('token');
      // We fetch the full detail including "aboutHiring" from the company endpoint
      const res = await fetch(`http://localhost:5800/api/companies/${id}/gap`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      
      // Let's also fetch the about description if not in gap
      const companyRes = await fetch(`http://localhost:5800/api/companies/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const companyData = await companyRes.json();

      if (result.success) {
        setGapData({
          ...result.data,
          about: companyData.data?.aboutHiring || "Top product engineering firm."
        });
      }
    } catch (err) { console.error(err); }
    finally { setFetchingGap(false); }
  };

  if (loading) return (
     <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#009D77]" />
     </div>
  );

  return (
    <>
      <div className="min-h-screen bg-[#fbfbfa] relative overflow-hidden flex flex-col pt-4 pb-12 px-6">
        <div className="absolute top-[-10%] left-[10%] w-[30%] h-[40%] bg-[#E8FAF5] rounded-full blur-[140px] pointer-events-none opacity-50" />
        
        <main className="flex-1 w-full max-w-6xl mx-auto relative z-10 space-y-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end border-b border-gray-100 pb-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-black text-[#011813] tracking-tight uppercase">Best Fit Analysis</h1>
                  <span className="px-2 py-0.5 bg-[#EC4899] text-white rounded text-[8px] font-black uppercase tracking-widest">Top Picks</span>
               </div>
               <p className="text-[#3b4b45]/60 font-medium text-xs max-w-xl">
                 AI-driven compatibility ranking based on <span className="text-[#011813] font-black uppercase">{targetRole}</span> benchmarks.
               </p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-1">Last Analysis</p>
               <p className="text-sm font-bold text-[#011813]">Current Session</p>
            </div>
          </motion.div>

          {/* Custom Benchmark Analysis Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FFF0F6] border border-[#EC4899]/10 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 group"
          >
             <div className="w-16 h-16 bg-[#EC4899] rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-lg shadow-[#EC4899]/20 transform group-hover:rotate-6 transition-transform">
                <Zap className="w-8 h-8 text-white" />
             </div>
             
             <div className="flex-1 space-y-4">
                <div>
                   <h2 className="text-xl font-black text-[#011813] tracking-tight uppercase">Custom Benchmark Analysis</h2>
                   <p className="text-[#3b4b45]/60 font-medium text-[11px] leading-relaxed">
                     Paste a specific job description or an interview process description here. 
                     Our AI will judge your <span className="text-[#EC4899] font-bold">Industry Match Score</span> against these custom requirements.
                   </p>
                </div>
                
                <div className="relative">
                  <textarea 
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Example: Round 1 involves React & System Design. Round 2 is Python based DSA..."
                    className="w-full h-24 bg-white/60 border border-[#EC4899]/10 rounded-2xl p-4 text-xs font-semibold text-[#011813] focus:outline-none focus:ring-2 focus:ring-[#EC4899]/20 resize-none transition-all placeholder:opacity-50"
                  />
                  <button 
                    onClick={handleCustomBenchmark}
                    disabled={analyzingCustom || !customText.trim()}
                    className="absolute bottom-3 right-3 px-6 py-2 bg-[#011813] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#EC4899] transition-all disabled:opacity-50 shadow-lg"
                  >
                    {analyzingCustom ? "Analyzing..." : "Analyze Process"}
                  </button>
                </div>
             </div>
          </motion.div>

          {matches.length === 0 ? (
             <div className="bg-white p-16 rounded-[2.5rem] text-center shadow-sm border border-gray-100 border-dashed">
               <h3 className="text-xl font-black text-[#011813] mb-3 uppercase tracking-tight">Sync Required</h3>
               <p className="text-gray-400 text-xs mb-8 font-medium">Calibration required for market analysis. Start with resume calibration.</p>
               <button onClick={() => window.location.href='/resume'} className="px-10 py-3.5 bg-[#011813] text-white rounded-xl font-black hover:bg-[#009D77] transition-all uppercase tracking-widest text-[10px]">Initialize Alignment</button>
             </div>
          ) : (
            <div className="space-y-6">
               {/* Hero Match (#1) */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 onClick={() => fetchGap(matches[0].companyId)}
                 className="bg-[#011813] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-8 group cursor-pointer"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#009D77]/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-700" />
                  
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center font-black text-4xl text-white border border-white/20 shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
                     {matches[0].company.charAt(0)}
                  </div>

                  <div className="flex-1 text-center md:text-left relative z-10">
                     <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-[#009D77] text-white rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#009D77]/40">Rank #1</span>
                        <span className="text-white/40 font-black uppercase tracking-widest text-[10px]">{matches[0].tier} Tier Core</span>
                     </div>
                     <h2 className="text-3xl font-black tracking-tight mb-2 uppercase group-hover:text-[#009D77] transition-colors">{matches[0].company}</h2>
                     <p className="text-white/60 text-sm font-medium leading-relaxed max-w-lg mb-0">{matches[0].readinessLabel}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-5 border border-white/10 text-center min-w-[150px] shrink-0">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">Alignment</p>
                     <p className="text-4xl font-black text-[#009D77]">{matches[0].currentMatchPercent}%</p>
                  </div>

                  <div className="h-full bg-white text-[#011813] p-6 rounded-[1.5rem] flex items-center justify-center group-hover:bg-[#009D77] group-hover:text-white transition-all shadow-xl">
                     <ArrowUpRight className="w-5 h-5" />
                  </div>
               </motion.div>

               {/* Comparison Grid (Top 2-5) */}
               <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Secondary Hiring Pipelines</h3>
                     <span className="text-[9px] font-bold text-[#009D77] uppercase tracking-widest">Verified Matches</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {matches.slice(1).map((comp, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          onClick={() => fetchGap(comp.companyId)}
                          className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:translate-x-0.5 transition-all group cursor-pointer h-full flex flex-col"
                        >
                           <div className="flex justify-between items-start mb-6">
                              <div className="w-10 h-10 bg-[#fbfcfa] rounded-xl flex items-center justify-center font-black text-lg text-[#011813] border border-gray-100 group-hover:scale-110 group-hover:border-[#009D77]/20 transition-all">
                                 {comp.company.charAt(0)}
                              </div>
                              <span className="text-[9px] font-black text-[#009D77] bg-[#E8FAF5] px-2 py-0.5 rounded tracking-widest">#{idx + 2}</span>
                           </div>
                           <h4 className="text-sm font-black text-[#011813] leading-tight mb-2 uppercase tracking-tight group-hover:text-[#009D77] transition-colors">{comp.company}</h4>
                           
                           <div className="mt-auto space-y-4">
                              <div className="flex justify-between items-end mb-1">
                                 <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Compatability Score</span>
                                 <span className="text-xs font-black text-[#009D77]">{comp.currentMatchPercent}%</span>
                              </div>
                              <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                                 <div className="h-full bg-gradient-to-r from-[#009D77] to-[#2EEAAB]" style={{ width: `${comp.currentMatchPercent}%` }} />
                              </div>
                              <div className="flex justify-between text-[7px] font-black text-[#475467] uppercase tracking-widest opacity-60">
                                 <span>{comp.tier} Core</span>
                                 <span>{comp.sector}</span>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* High-Density Match Detail Modal */}
      <AnimatePresence>
        {selectedCompanyId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[#011813]/90 backdrop-blur-sm" onClick={() => setSelectedCompanyId(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] shadow-2xl p-6 md:p-8 border border-white/20"
            >
              <button 
                onClick={() => setSelectedCompanyId(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all font-bold"
              >
                &times;
              </button>

              {(fetchingGap || analyzingCustom) ? (
                <div className="py-20 flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#009D77] mb-6" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Running Benchmark Engine...</p>
                </div>
              ) : gapData && (
                <div className="space-y-6">
                  {/* Modal Header */}
                  <div className="flex items-end justify-between border-b border-gray-50 pb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-black text-[#011813] uppercase tracking-tighter">{gapData.company}</h2>
                        <span className="px-2 py-0.5 bg-[#EC4899] text-white rounded text-[8px] font-black uppercase tracking-widest">Industry Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-0.5 bg-[#E8FAF5] text-[#009D77] rounded text-[8px] font-black uppercase tracking-[0.2em]">Active Pipeline</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Benchmarked Fit</p>
                      <p className="text-4xl font-extrabold text-[#009D77] leading-none">{gapData.currentMatchPercent}%</p>
                    </div>
                  </div>

                  {/* Company Mission / About */}
                  <div className="bg-[#fbfcfa] p-5 rounded-2xl border border-gray-50">
                     <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-3">Enterprise Mission</h3>
                     <p className="text-xs font-medium text-[#011813]/80 leading-relaxed italic">
                        "{gapData.about}"
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skills Gaps */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest">Technical Requirement Gaps</h3>
                      <div className="space-y-2">
                        {gapData.topGaps.map((gap, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-rose-100 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="text-[11px] font-black text-[#011813] uppercase tracking-tight">{gap.skill}</h4>
                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Priority #{idx + 1}</span>
                             </div>
                             <p className="text-[9px] font-medium text-gray-500 mb-3 leading-tight">{gap.actionToFix}</p>
                             <div className="flex items-center gap-3">
                               <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                 <div className="h-full bg-rose-400" style={{ width: `${(gap.studentDepth / gap.minimumDepth) * 100}%` }} />
                               </div>
                               <span className="text-[8px] font-black text-[#011813] opacity-40">{gap.studentDepth} / {gap.minimumDepth} LVL</span>
                             </div>
                          </div>
                        ))}
                        {gapData.topGaps.length === 0 ? (
                           gapData.currentMatchPercent === 100 ? (
                            <div className="bg-[#E8FAF5] p-6 rounded-xl text-[#009D77] text-[10px] font-black uppercase tracking-widest text-center border border-[#009D77]/20">
                              Requirement threshold reached. Readiness: Optimum.
                            </div>
                           ) : (
                            <div className="bg-[#FFF8F8] p-6 rounded-xl text-[#EA4C89] text-[10px] font-black uppercase tracking-widest text-center border border-[#EA4C89]/10">
                              0 Skills Recognized. Please describe the tech requirements specifically.
                            </div>
                           )
                        ) : null}
                      </div>
                    </div>

                    {/* AI Decision Verdict */}
                    <div className="space-y-4 flex flex-col">
                       <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest">AI Recruitment Summary</h3>
                       <div className="bg-[#011813] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden flex-1 flex flex-col">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[#009D77]/20 rounded-full blur-2xl" />
                          <p className="text-[11px] font-bold leading-relaxed mb-8 opacity-90 border-l-2 border-[#009D77] pl-3">
                             {gapData.verdict}
                          </p>
                          <div className="mt-auto border-t border-white/10 pt-4">
                             <div className="flex justify-between items-center text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                                <span>Projected Alignment</span>
                                <span className="text-white text-lg font-black">{gapData.projectedMatchIfAllFixed}%</span>
                             </div>
                          </div>
                       </div>
                       
                       <button 
                         onClick={() => window.location.href=`/roadmap?generateFor=${gapData.companyId}`}
                         className="w-full py-4 bg-[#009D77] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#011813] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#009D77]/20"
                       >
                         Sync Training Path <ArrowUpRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
