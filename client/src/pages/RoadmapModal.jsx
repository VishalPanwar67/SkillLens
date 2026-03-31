import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Zap, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function RoadmapModal({ isOpen, onClose, week, onToggleTask }) {
  if (!week) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#011813]/90 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col z-[10000]"
      >
        {/* Header - Compact */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
           <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#E8FAF5] text-[#009D77] rounded-md text-[8px] font-black uppercase tracking-wider">
                  Week {week.weekNumber}
                </span>
                <h2 className="text-xl font-black text-[#011813] leading-tight tracking-tight">{week.theme}</h2>
              </div>
              <p className="text-[#3b4b45]/60 font-bold text-[10px] leading-tight line-clamp-1">{week.goal}</p>
           </div>
           <button onClick={onClose} className="ml-4 p-2 hover:bg-gray-100 rounded-xl transition-all">
              <X className="w-5 h-5 text-gray-300" />
           </button>
        </div>

        {/* Task List - Dense */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide bg-[#fbfbfa]">
           <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
             <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Growth Checkpoints</h3>
             <span className="text-[9px] font-black text-[#009D77] uppercase tracking-widest">{week.tasks?.filter(t => t.done).length} / {week.tasks?.length} Completed</span>
           </div>
           
           <div className="space-y-3">
              {week.tasks && week.tasks.length > 0 ? (
                week.tasks.map((task, idx) => (
                   <div 
                     key={task.id || idx} 
                     className={`p-4 rounded-2xl border transition-all duration-300 ${task.done ? 'bg-emerald-50/10 border-emerald-100/50' : 'bg-white border-gray-100 hover:border-[#009D77]/30 shadow-sm'}`}
                   >
                      <div className="flex items-start gap-4">
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             onToggleTask(week.weekNumber, task.id, !task.done);
                           }}
                           className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500 rounded-lg ${task.done ? 'bg-[#009D77] border-[#009D77] text-white' : 'border-gray-200 hover:border-[#009D77]'}`}
                         >
                            {task.done && <CheckCircle2 className="w-4 h-4" />}
                         </button>
                         <div className="flex-1">
                            <div className="flex justify-between items-start gap-3 mb-1">
                               <h4 className={`text-sm font-black leading-tight ${task.done ? 'text-emerald-800 opacity-60 line-through' : 'text-[#011813]'}`}>{task.title}</h4>
                               <div className="flex gap-1 shrink-0">
                                  <span className="px-1.5 py-0.5 bg-gray-50 rounded text-[7px] font-black uppercase text-gray-400 flex items-center gap-1">
                                     <Clock className="w-2.5 h-2.5" /> {task.estimateHours}h
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1 ${task.difficulty === 'hard' ? 'bg-rose-50 text-rose-400' : task.difficulty === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-[#E8FAF5] text-[#009D77]'}`}>
                                     <Zap className="w-2.5 h-2.5" /> {task.difficulty}
                                  </span>
                               </div>
                            </div>
                            <p className="text-[#3b4b45]/60 text-[10px] font-medium leading-normal mb-3">{task.description}</p>
                            
                            {task.deliverable && (
                               <div className="p-2 bg-gray-50 rounded-lg flex items-center gap-2 border border-black/5">
                                  <div className="w-1 h-1 bg-[#009D77] rounded-full" />
                                  <p className="text-[8px] font-bold text-[#3b4b45]/70 italic line-clamp-1">{task.deliverable}</p>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                ))
              ) : (
                <div className="py-12 text-center">
                   <p className="text-gray-300 text-[10px] font-bold italic">Deep learning session active.</p>
                </div>
              )}
           </div>
        </div>

        {/* Footer - Minimal */}
        <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center sticky bottom-0 z-20">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                 <div className="absolute bottom-0 left-0 right-0 bg-[#009D77]/10" style={{ height: `${Math.round((week.tasks?.filter(t => t.done).length / week.tasks?.length) * 100 || 0)}%` }} />
                 <span className="text-xs font-black text-[#011813] relative z-10">{Math.round((week.tasks?.filter(t => t.done).length / week.tasks?.length) * 100 || 0)}%</span>
              </div>
              <div>
                 <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Overall status</p>
                 <p className="text-[10px] font-black text-[#011813]">{week.tasks?.filter(t => t.done).length} / {week.tasks?.length} Point Set</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="px-6 py-3 bg-[#011813] text-white rounded-xl font-black hover:bg-[#009D77] transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/20"
           >
              Dismiss View
           </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(content, document.body);
}
