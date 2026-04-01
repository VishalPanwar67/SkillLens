import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Search, MapPin, Users, Target, ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function Company() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [customTargets, setCustomTargets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { "Authorization": `Bearer ${token}` };
        
        // Fetch target role from profile
        const profRes = await fetch("http://localhost:5800/api/auth/profile", { headers });
        const profData = await profRes.json();
        if (profData.success) {
          setTargetRole(profData.data?.user?.targetRole || "fullstack");
        }

        // Standard Companies
        const response = await fetch("http://localhost:5800/api/companies", { headers });
        const result = await response.json();
        
        // Custom Targets
        const customRes = await fetch("http://localhost:5800/api/custom-hiring", { headers });
        const customResult = await customRes.json();

        if (result.success) {
          const standard = result.data.companies.map(c => ({
            id: c.id,
            name: c.name,
            location: c.sector || "Enterprise",
            type: c.type,
            fit: c.matchPercent,
            isCustom: false
          }));

          const custom = (customResult.data || []).map(t => ({
            id: t._id,
            name: t.companyName,
            location: t.roleTitle,
            type: "Custom target",
            fit: t.matchPercent,
            isCustom: true
          }));

          // Filter out global companies if a custom one with the same name exists
          const customNames = new Set(custom.map(c => c.name.toLowerCase().trim()));
          const filteredStandard = standard.filter(s => !customNames.has(s.name.toLowerCase().trim()));

          setCompanies([...custom, ...filteredStandard]);
        }
      } catch (err) {
        setError("Error connecting to marketplace");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [fetchingGap, setFetchingGap] = useState(false);

  const fetchGap = async (id, isCustom = false) => {
    setSelectedCompanyId(id);
    setFetchingGap(true);
    setGapData(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { "Authorization": `Bearer ${token}` };

      if (isCustom) {
        const res = await fetch(`http://localhost:5800/api/custom-hiring`, { headers });
        const result = await res.json();
        const found = (result.data || []).find(t => t._id === id);
        if (found) {
          setGapData({
             company: found.companyName,
             currentMatchPercent: found.matchPercent,
             about: found.about,
             process: found.hiringProcess,
             topGaps: [], // No gap logic for custom yet (simplify)
             verdict: `Custom target benchmarked at ${found.matchPercent}% alignment for ${found.roleTitle}.`,
             projectedMatchIfAllFixed: found.matchPercent
          });
        }
      } else {
        const res = await fetch(`http://localhost:5800/api/companies/${id}/gap`, { headers });
        const result = await res.json();
        const companyRes = await fetch(`http://localhost:5800/api/companies/${id}`, { headers });
        const companyResult = await companyRes.json();
        
        if (result.success && companyResult.success) {
          setGapData({
            ...result.data,
            about: companyResult.data.aboutHiring || "Top industry leader in product engineering.",
            process: companyResult.data.hiringProcess || ["Aptitude", "Technical", "HR"]
          });
        }
      }
    } catch (err) { console.error(err); }
    finally { setFetchingGap(false); }
  };

  const handleDeleteCustom = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this custom benchmark?")) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5800/api/custom-hiring/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f8faf9] relative overflow-hidden flex flex-col pt-4 pb-12 px-6">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
           <div className="absolute top-[10%] left-[20%] w-[30%] h-[40%] bg-[#fae8fb] rounded-full blur-[140px]" />
           <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[30%] bg-[#d2fbf0] rounded-full blur-[120px]" />
        </div>

        <main className="flex-1 w-full max-w-6xl mx-auto relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-[#0b261d] tracking-tight mb-2 flex items-center gap-3 lowercase">
                 <Building2 className="w-8 h-8 text-[#009D77]" /> <span className="uppercase tracking-tighter">Company Radar</span>
              </h1>
              <p className="text-[#3b4b45]/70 font-medium text-sm">
                Skill alignment analysis for <span className="text-[#011813] font-black uppercase tracking-widest">{targetRole || "fullstack"}</span> pipelines.
              </p>
            </div>
            <div>
               <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3.5 bg-[#011813] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#009D77] transition-all flex items-center gap-3 shadow-2xl border border-white/10"
               >
                  Add Custom Benchmark <Target className="w-4 h-4" />
               </button>
            </div>
          </motion.div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="w-10 h-10 animate-spin text-[#009D77] mb-4" />
             </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-500 rounded-2xl p-8 text-center italic font-bold">
              <p>{error}</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
             {companies.map((company, i) => (
                <motion.div 
                   key={i}
                   onClick={() => fetchGap(company.id, company.isCustom)}
                   className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-[#009D77]/10 transition-all flex flex-col justify-between group cursor-pointer h-full relative"
                >
                   <div className="mb-6">
                      <div className="flex justify-between items-start mb-6">
                         <div className="w-11 h-11 bg-[#011813] text-white rounded-2xl flex items-center justify-center font-black text-xl transition-all group-hover:scale-110 group-hover:bg-[#009D77]">
                            {company.name.charAt(0)}
                         </div>
                         <div className="flex flex-col items-end gap-1.5">
                            {company.isCustom ? (
                               <span className="px-2.5 py-1 bg-[#EC4899] text-white rounded-lg text-[7px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#EC4899]/30">Custom</span>
                            ) : (
                               <span className="px-2 py-0.5 border border-gray-100 text-gray-300 rounded-md text-[7px] font-black uppercase tracking-widest">Global</span>
                            )}
                           <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${company.fit > 0 ? 'bg-[#E8FAF5] text-[#009D77]' : 'bg-orange-50 text-orange-600'}`}>
                               {company.fit}% Match
                            </span>
                         </div>
                      </div>
                      <h3 className="text-base font-black text-[#011813] uppercase tracking-tight mb-1 transition-colors group-hover:text-[#009D77]">{company.name}</h3>
                      <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">
                         <MapPin className="w-3 h-3 text-[#009D77]/40" /> {company.location}
                      </div>
                   </div>
                   <div className="pt-5 border-t border-gray-50 flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                      <span className="text-gray-300 group-hover:text-[#009D77] transition-colors">{company.isCustom ? "Private Pipeline" : "Sync Active"}</span>
                      {company.isCustom ? (
                         <button 
                            onClick={(e) => handleDeleteCustom(company.id, e)}
                            className="w-8 h-8 bg-gray-50 text-gray-300 hover:bg-rose-50 hover:text-rose-500 rounded-lg flex items-center justify-center transition-all"
                         >
                            &times;
                         </button>
                      ) : (
                         <ArrowUpRight className="w-3 h-3 opacity-20 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all text-[#009D77]" />
                      )}
                   </div>
                </motion.div>
              ))}
          </div>
          )}
        </main>
      </div>

      {/* Detail Modal - High Density */}
      {selectedCompanyId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#011813]/90 backdrop-blur-sm" onClick={() => setSelectedCompanyId(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl p-6 md:p-8 flex flex-col">
            <button onClick={() => setSelectedCompanyId(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-all">
               <span className="text-2xl font-bold text-gray-300">&times;</span>
            </button>
            
            {fetchingGap ? (
              <div className="py-20 flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#009D77] mb-4" />
                <p className="font-black text-[9px] uppercase tracking-widest text-gray-400">Benchmarking Stack Requirements...</p>
              </div>
            ) : gapData ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-end justify-between border-b border-gray-50 pb-6">
                     <div>
                       <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black text-[#011813] uppercase tracking-tight">{gapData.company}</h2>
                          <span className="px-2 py-0.5 bg-[#EC4899] text-white rounded text-[8px] font-black uppercase tracking-widest">Enterprise Pro</span>
                       </div>
                       <p className="text-[#009D77] font-black uppercase tracking-[0.2em] text-[9px]">Industry Segment: {gapData.sector}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Your Compatibility</p>
                       <p className="text-4xl font-extrabold text-[#009D77] leading-none">{gapData.currentMatchPercent}%</p>
                     </div>
                  </div>

                  {/* About Section */}
                  <div className="bg-[#fbfcfa] p-5 rounded-2xl border border-gray-50">
                     <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-2">Technical Culture & Hiring</h3>
                     <p className="text-xs font-medium text-[#011813]/80 leading-relaxed italic">
                        "{gapData.about}"
                     </p>
                  </div>

                  {/* Two Column Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Skills Gaps */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest">Skill Alignment Benchmark</h3>
                         <span className="text-[8px] font-black text-[#009D77] uppercase bg-[#E8FAF5] px-2 py-0.5 rounded tracking-widest">Gaps Detected</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {gapData.topGaps.map((gap, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl relative group hover:border-[#EC4899]/30 transition-all">
                             <div className="flex justify-between items-start mb-2">
                               <h4 className="text-[10px] font-black text-[#011813] uppercase tracking-tight leading-none">{gap.skill}</h4>
                               <span className="text-[7px] font-black text-rose-500 uppercase tracking-[0.2em]">Gap: {gap.depthGap} Lv</span>
                             </div>
                             <p className="text-[8px] font-medium text-gray-400 mb-3 leading-tight line-clamp-2">{gap.actionToFix}</p>
                             <div className="flex items-center gap-2">
                               <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                 <div className="h-full bg-rose-400" style={{ width: `${(gap.studentDepth / gap.minimumDepth) * 100}%` }} />
                               </div>
                               <span className="text-[7px] font-black text-gray-300">{gap.studentDepth}/{gap.minimumDepth}</span>
                             </div>
                          </div>
                        ))}
                        {gapData.topGaps.length === 0 && (
                          <div className="col-span-2 bg-[#E8FAF5] p-5 rounded-xl text-[#009D77] text-[10px] uppercase font-black tracking-widest text-center border border-[#009D77]/20">
                            You meet all requirement thresholds for current roles.
                          </div>
                        )}
                      </div>

                      {/* Hiring Process */}
                      <div className="mt-4">
                         <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest mb-3">Interview Pipeline</h3>
                         <div className="flex flex-wrap gap-2">
                            {gapData.process.map((step, idx) => (
                               <div key={idx} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                  <span className="w-4 h-4 bg-[#011813] text-white rounded-full flex items-center justify-center text-[8px] font-black">{idx + 1}</span>
                                  <span className="text-[9px] font-black text-[#011813] uppercase tracking-widest">{step}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                    </div>

                    {/* AI Column */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-[#475467] uppercase tracking-widest">AI Verdict</h3>
                      <div className="bg-[#011813] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden h-fit flex flex-col justify-between min-h-[160px]">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#009D77]/20 rounded-full blur-2xl" />
                        <p className="text-[10px] font-bold leading-relaxed mb-6 opacity-80 uppercase tracking-tight text-white/90 italic">"{gapData.verdict}"</p>
                        <div className="border-t border-white/10 pt-4">
                           <div className="flex justify-between items-end text-[7px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                              <span>Potential Fit</span>
                              <span className="text-white text-base font-black leading-none">{gapData.projectedMatchIfAllFixed}%</span>
                           </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => window.location.href = `/roadmap?generateFor=${gapData.companyId}`}
                        className="w-full py-4 bg-[#009D77] hover:bg-[#EC4899] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#009D77]/10"
                      >
                        Start Training <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
            ) : (
              <div className="p-10 text-center text-gray-400 font-bold">Failed to load details.</div>
            )}
          </motion.div>
        </div>
      )}
      {/* Add Custom Benchmark Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#011813]/90 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative bg-white w-full max-w-xl rounded-[2rem] shadow-2xl p-8 overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#009D77]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <h2 className="text-xl font-black text-[#011813] uppercase tracking-tighter mb-1">Add Custom Benchmark</h2>
               <p className="text-[#3b4b45]/60 text-[10px] font-bold uppercase tracking-widest mb-6">target specific industry pipelines</p>
               
               <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const payload = {
                     companyName: formData.get('companyName'),
                     roleTitle: formData.get('roleTitle'),
                     sector: formData.get('sector'),
                     requiredSkills: [
                        { skill: "react", minimumDepth: 60, weight: 40 },
                        { skill: "nodejs", minimumDepth: 55, weight: 30 },
                        { skill: "sql", minimumDepth: 50, weight: 30 }
                     ]
                  };
                  try {
                     const token = localStorage.getItem('token');
                     await fetch("http://localhost:5800/api/custom-hiring", {
                        method: "POST",
                        headers: { 
                           "Authorization": `Bearer ${token}`,
                           "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                     });
                     window.location.reload();
                  } catch(err) { console.error(err); }
               }}>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Company</label>
                        <input name="companyName" required placeholder="e.g. Google India" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#009D77] outline-none transition-all" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Role</label>
                        <input name="roleTitle" required placeholder="e.g. SDE-1" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#009D77] outline-none transition-all" />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Industry Sector</label>
                     <input name="sector" placeholder="e.g. Deep Tech / AI" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#009D77] outline-none transition-all" />
                  </div>
                  <div className="p-4 bg-[#fbfcfa] rounded-2xl border border-dashed border-gray-200">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">AI will automatically benchmark against role standards</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                     <button type="submit" className="flex-2 px-12 py-4 bg-[#009D77] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#011813] transition-all shadow-lg shadow-[#009D77]/20">Create Target</button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
