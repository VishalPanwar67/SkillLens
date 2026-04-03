import React, { useState } from "react";
import { apiFetch } from "../../utils/apiFetch";
import { useRequireApiKey } from "../../hooks/useRequireApiKey";
import ApiKeyModal from "../ApiKeyModal";
import { 
  X, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Zap,
  Target,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyPlanner({ skill, onClose }) {
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showModal, setShowModal, checkKey } = useRequireApiKey();

  const generatePlan = async () => {
    if (!checkKey()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await apiFetch("/api/skill-roadmap/daily-plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skill, days })
      });

      if (res.ok) {
        const result = await res.json();
        setPlan(result.data);
      }
    } catch (err) {
      console.error("Plan Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {showModal && (
        <ApiKeyModal
          required={true}
          onSuccess={() => setShowModal(false)}
        />
      )}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-xl bg-white border border-[#E7E7E8] rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="p-6 border-b border-[#E7E7E8] bg-[#F8F9FA] flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#009D77] rounded-xl flex items-center justify-center text-white">
                 <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#011813] leading-none uppercase tracking-tight">Daily Study Planner</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-[#E7E7E8] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#475467]" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           {!plan ? (
              <div className="space-y-6">
                 <div>
                    <h4 className="text-sm font-bold text-[#011813] mb-3">How many days do you have to learn {skill}?</h4>
                    <div className="grid grid-cols-4 gap-3">
                       {[3, 7, 14, 30].map((d) => (
                          <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`py-3 rounded-xl border text-sm font-black transition-all ${
                               days === d 
                               ? 'bg-[#009D77] border-[#009D77] text-white shadow-lg shadow-[#009D77]/20 scale-105' 
                               : 'bg-white border-[#E7E7E8] text-[#475467] hover:border-[#D0D5DD]'
                            }`}
                          >
                             {d} {d === 1 ? 'Day' : 'Days'}
                          </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   onClick={generatePlan}
                   disabled={loading}
                   className="w-full bg-[#011813] text-white py-4 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
                 >
                    {loading ? "AI Generating Plan..." : "Generate AI Planner"}
                 </button>
              </div>
           ) : (
              <div className="space-y-4">
                 {plan.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 p-5 bg-[#F8F9FA] border border-[#E7E7E8] rounded-2xl group hover:border-[#009D77] transition-all"
                    >
                       <div className="w-10 h-10 rounded-full bg-white border border-[#E7E7E8] flex items-center justify-center shrink-0 shadow-sm group-hover:bg-[#009D77] group-hover:text-white transition-all">
                          <span className="text-xs font-black">D{item.day}</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-[#011813] mb-1">{item.tasks}</p>
                          <p className="text-[10px] font-bold text-[#475467] uppercase tracking-widest flex items-center gap-2">
                             <Target className="w-3 h-3 text-[#009D77]" /> {item.goal}
                          </p>
                       </div>
                    </motion.div>
                 ))}
                 <button 
                   onClick={() => setPlan(null)}
                   className="w-full mt-6 text-xs font-bold text-[#475467] hover:text-[#011813] transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                 >
                    Reset Planner
                 </button>
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
