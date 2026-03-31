import React from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";

export default function SkillRoadmapCard({ skill, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white border border-[#E7E7E8] rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group cursor-pointer hover:border-[#009D77] transition-all duration-300"
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.15] scale-150 rotate-12 transition-all duration-300">
        <BookOpen className="w-24 h-24 text-[#009D77]" />
      </div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 bg-[#E8FAF5] rounded-xl flex items-center justify-center border border-[#009D77]/20 group-hover:bg-[#009D77] transition-all duration-300">
          <BookOpen className="w-5 h-5 text-[#009D77] group-hover:text-white transition-all duration-300" />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#011813] leading-none mb-1 uppercase tracking-tight">{skill.name}</h3>
          <p className="text-[10px] font-bold text-[#475467] uppercase tracking-wider">{skill.status}</p>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-black text-[#011813]">{skill.progress}% Complete</span>
          <span className="text-[11px] font-bold text-[#475467] uppercase tracking-wider">Target Readiness</span>
        </div>
        <div className="h-3 bg-[#f0f1f2] rounded-full overflow-hidden border border-[#e2e4e6]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${skill.progress}%` }}
            className="h-full bg-gradient-to-r from-[#009D77] to-[#2EEAAB] rounded-full"
          />
        </div>
      </div>

      <button className="w-full bg-[#F8F9FA] text-[#011813] font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-2 group-hover:bg-[#011813] group-hover:text-white transition-all duration-300 mt-auto uppercase tracking-widest shadow-sm">
        Start Learning
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
      </button>
    </motion.div>
  );
}
