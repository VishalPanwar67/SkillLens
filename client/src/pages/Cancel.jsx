import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const Cancel = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-20 h-20 bg-[#FFF0F6] rounded-full flex items-center justify-center mb-8"
      >
        <XCircle className="w-10 h-10 text-[#EC4899]" />
      </motion.div>
      <h1 className="text-3xl font-extrabold text-[#011813] mb-3 tracking-tight">Payment Cancelled</h1>
      <p className="text-sm text-[#475467] font-medium max-w-sm mx-auto mb-10 leading-relaxed">
        Your transaction was not completed. No credits were added to your account. 
        If this was a mistake, you can try again below.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/pricing" 
          className="bg-[#EC4899] text-white px-8 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-[#D81B60] transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Try Again
        </Link>
        <Link 
         to="/dashboard"
          className="bg-[#F0F2F5] text-[#011813] px-8 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-[#E7E7E8] transition-all"
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          Need Help?
        </Link>
      </div>
    </div>
  );
};

export default Cancel;
