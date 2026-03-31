import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, ChevronRight, BarChart3, Clock, AlertCircle, Loader2, ArrowRight, BookOpen, Target } from 'lucide-react';

export default function Resume() {
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);
  const [targetRole, setTargetRole] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.targetRole || 'frontend';
    } catch {
      return 'frontend';
    }
  });

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setUploadMessage(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("targetRole", targetRole);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5800/api/resume/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.success) {
         setUploadMessage({ type: "success", text: "Successfully analyzed!" });
         setAnalysis(result.data);
      } else {
         setUploadMessage({ type: "error", text: result.message || "Failed to upload" });
      }
    } catch (err) {
      setUploadMessage({ type: "error", text: "Connection error" });
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="h-screen bg-[#fcfdfd] overflow-hidden flex flex-col pt-18 pb-4 px-4 lg:px-6 font-sans relative">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-30 select-none">
        <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-[#009D77]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-[#EC4899]/5 rounded-full blur-[80px]" />
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col relative z-10 gap-3">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#009D77] rounded-xl flex items-center justify-center shadow-lg shadow-[#009D77]/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#011813] leading-tight">Resume Analyzer</h1>
              <p className="text-[10px] font-bold text-[#475467] uppercase tracking-wider">Senior ATS Matching Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#475467] uppercase pr-1">Target Role:</span>
            <select 
              value={targetRole} 
              onChange={(e) => setTargetRole(e.target.value)}
              className="bg-white border border-[#E7E7E8] text-xs font-bold text-[#011813] rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#009D77] cursor-pointer shadow-sm"
            >
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="fullstack">Fullstack</option>
              <option value="data">Data Engineer</option>
              <option value="java">Java Backend</option>
            </select>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
          {/* Left Column: Upload - Now wider */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-[#E7E7E8] rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-hidden"
            >
              <div 
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all p-6 ${isDragging ? 'border-[#009D77] bg-[#E8FAF5]' : 'border-gray-100 hover:border-[#009D77]/30 hover:bg-gray-50/50'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf" ref={fileInputRef} onChange={onFileChange} className="hidden" />
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                     <Loader2 className="w-10 h-10 text-[#009D77] animate-spin" />
                     <p className="text-[#011813] text-sm font-bold">Analyzing Resume...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                      <UploadCloud className="w-8 h-8 text-[#009D77]" />
                    </div>
                    <h3 className="text-base font-bold text-[#011813] mb-1">Click or Drop PDF</h3>
                    <p className="text-xs text-[#475467] font-medium mb-6 text-center max-w-[200px]">Ensure your resume is ATS-compatible for best results.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2.5 bg-[#011813] hover:bg-[#009D77] text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 group shadow-md"
                    >
                      Browse Files <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </>
                )}
              </div>
              
              {uploadMessage && (
                <div className={`mt-3 p-2.5 rounded-lg text-xs text-center font-bold ${uploadMessage.type === 'success' ? 'bg-[#E8FAF5] text-[#009D77]' : 'bg-red-50 text-red-500'}`}>
                  {uploadMessage.text}
                </div>
              )}

              {/* Quick Status Metric */}
              <div className={`mt-4 p-4 rounded-xl border border-[#E7E7E8] bg-[#F8F9FA] relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Target className="w-10 h-10 text-[#011813]" />
                </div>
                <p className="text-[10px] font-bold text-[#475467] uppercase tracking-wider mb-2">Readiness Score</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-[#011813] leading-none">{analysis ? analysis.coveragePercent : '00'}</span>
                  <span className="text-sm font-bold text-[#475467] mb-0.5">/ 100</span>
                </div>
              </div>

              {analysis && (
                <button 
                  onClick={() => {
                    localStorage.setItem('requestRoadmap', 'true');
                    window.location.href = '/roadmap';
                  }}
                  className="mt-4 w-full bg-[#009D77] hover:bg-[#008a68] text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-[#009D77]/10 transition-all flex items-center justify-center gap-2"
                >
                  Generate Path <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Skills Visualization - Narrower now */}
          <div className="lg:col-span-7 flex flex-col gap-3 overflow-hidden h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
              
              {/* Detected Skills */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white border border-[#E7E7E8] rounded-2xl p-3 shadow-sm flex flex-col h-[280px] overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 border-b border-[#F8F9FA] pb-2">
                  <h3 className="text-[13px] font-bold text-[#011813] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#009D77]" /> 
                    Skills Detected
                  </h3>
                  <span className="text-[9px] font-black bg-[#E8FAF5] text-[#009D77] px-1.5 py-0.5 rounded">
                    {analysis ? analysis.detectedSkills.length : '0'} FOUND
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 overflow-x-hidden custom-scrollbar">
                  {analysis ? (
                    <div className="flex flex-wrap gap-1 pb-1">
                       {analysis.detectedSkills.map(s => (
                         <span key={s} className="px-2 py-0.5 bg-[#F8F9FA] text-[#011813] rounded text-[10px] font-semibold border border-[#E7E7E8] hover:border-[#009D77]/40 transition-colors">
                           {s}
                         </span>
                       ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 scale-90">
                      <BookOpen className="w-6 h-6 mb-1" />
                      <p className="text-[10px] font-medium">Pending analysis</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Missing Skills */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white border border-[#E7E7E8] rounded-2xl p-3 shadow-sm flex flex-col h-[280px] overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 border-b border-[#F8F9FA] pb-2">
                  <h3 className="text-[13px] font-bold text-[#011813] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#EC4899]" /> 
                    Skill Gaps
                  </h3>
                  <span className="text-[9px] font-black bg-[#FFF0F6] text-[#EC4899] px-1.5 py-0.5 rounded">
                    {analysis ? analysis.missingSkills.length : '0'} MISSING
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 overflow-x-hidden custom-scrollbar">
                  {analysis ? (
                    <div className="flex flex-wrap gap-1 pb-1">
                       {analysis.missingSkills.map(s => (
                         <span key={s} className="px-2 py-0.5 bg-[#FFF0F6] text-[#EC4899] rounded text-[10px] font-bold border border-[#fbdbe1] uppercase">
                           {s}
                         </span>
                       ))}
                       {analysis.missingSkills.length === 0 && (
                         <div className="w-full text-center py-6">
                            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-[#009D77] opacity-30" />
                            <p className="text-[10px] font-bold text-[#009D77]">No gaps found!</p>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 scale-90">
                      <Clock className="w-6 h-6 mb-1" />
                      <p className="text-[10px] font-medium">Pending analysis</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Bottom Insight Card - Even more compact */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white border border-[#E7E7E8] rounded-2xl p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#011813] text-white rounded-lg flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-extrabold text-[#011813]">ATS matching Insights</h4>
                  <p className="text-[10px] text-[#475467] font-medium leading-tight">
                    {analysis 
                      ? `${analysis.coveragePercent}% Match. Address the red labels to maximize interview chances.`
                      : "Upload resume to see how you rank against top industry standards."}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="w-16 h-1 bg-[#F0F2F5] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: analysis ? `${analysis.coveragePercent}%` : '0%' }}
                      transition={{ duration: 1 }}
                      className="h-full bg-[#009D77]" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E7E7E8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D0D5DD;
        }
      `}</style>
    </div>
  );
}
