import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, LayoutDashboard, Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";

const Success = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5800/api/payment/verify-session?sessionId=${sessionId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.message);
        }
      } catch (err) {
        console.error("Verification failed", err);
        setError("Could not verify your purchase. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6 max-w-xl mx-auto">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 text-[#009D77] animate-spin" />
           <p className="text-[#475467] font-bold uppercase tracking-widest text-xs">Securing Your Credits...</p>
        </div>
      ) : (
        <>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-20 h-20 bg-[#E8FAF5] rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-[#009D77]/10 relative group"
          >
            <div className="absolute inset-0 bg-[#009D77] rounded-3xl scale-0 group-hover:scale-110 transition-transform -z-10 opacity-5" />
            <CheckCircle2 className="w-10 h-10 text-[#009D77]" />
          </motion.div>
          
          <h1 className="text-3xl font-black text-[#011813] mb-3 tracking-tight">Payment Successful!</h1>
          
          <div className="bg-[#F8F9FA] border border-[#E7E7E8] rounded-2xl p-5 mb-8 flex items-center gap-4 w-full text-left">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#009D77]/20 flex items-center justify-center shrink-0">
               <Zap className="w-5 h-5 text-[#009D77]" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#009D77] leading-none mb-1">Balance Updated</p>
               <p className="text-sm font-semibold text-[#475467]">Your credits have been added to your dashboard.</p>
            </div>
          </div>
          
          <p className="text-base text-[#475467] font-medium leading-relaxed mb-10">
            {error ? error : "Great! Your account is now upgraded. You are ready to crush your next deep-dive mock interview."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Link 
              to="/dashboard" 
              className="bg-[#011813] text-white px-8 py-4 rounded-xl text-sm font-black flex items-center justify-center gap-3 hover:bg-[#08241b] transition-all shadow-lg shadow-[#011813]/20 group"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go Dashboard
            </Link>
            <Link 
              to="/interview" 
              className="bg-[#009D77] text-white px-8 py-4 rounded-xl text-sm font-black flex items-center justify-center gap-3 hover:bg-[#008a68] transition-all shadow-lg shadow-[#009D77]/20 group"
            >
              Start Interview
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Success;
