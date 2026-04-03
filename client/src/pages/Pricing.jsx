import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/api";
import { motion } from "framer-motion";
import { Check, Zap, Rocket, CreditCard, ChevronRight, Info } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51P1kRPIs7C2sR5V8uI6C7X9wN6Q2mO8... (PLACEHOLDER)");

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(apiUrl("/api/auth/profile"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCurrentCredits(data.data.user.credits || 0);
        }
      } catch (err) {
        console.error("Error fetching credits", err);
      }
    };
    fetchCredits();
  }, []);

  const handleCheckout = async (planId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/payment/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (data.success && data.data.url) {
         window.location.href = data.data.url;
      } else {
        alert("Failed to initiate checkout. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter Pack",
      price: "5",
      credits: 5,
      description: "Includes 5 Daily Free Credits + 5 Permanent Credits (1 Interview).",
      features: [
        "1 Premium Interview",
        "AI Technical Feedback",
        "Detailed Score Breakdown",
        "Permanent Purchase",
      ],
      icon: Zap,
      color: "#009D77",
      bg: "#E8FAF5",
      popular: false,
    },
    {
      id: "pro",
      name: "Elite Pack",
      price: "20",
      credits: 35,
      description: "Includes 5 Daily Free Credits + 35 Permanent Credits (7 Interviews).",
      features: [
        "7 Premium Interviews",
        "Advanced AI Analysis",
        "Priority Support",
        "Best Value Saving",
      ],
      icon: Rocket,
      color: "#EC4899",
      bg: "#FFF0F6",
      popular: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-[#E7E7E8] rounded-2xl p-5 md:p-6 shadow-sm gap-6 sm:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#011813] tracking-tight">Upgrade Preparation</h1>
          <p className="text-[12px] md:text-sm text-[#475467] font-medium mt-1">Choose a plan to boost your preparation frequency.</p>
        </div>
        
        <div className="flex items-center gap-4 sm:pl-6 sm:border-l border-[#F0F2F5]">
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-bold text-[#98A2B3] uppercase tracking-widest leading-none mb-1">Current Balance</p>
            <p className="text-xl font-black text-[#11b589]">{currentCredits} Credits</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8FAF5] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#009D77]" />
          </div>
        </div>
      </div>

      {/* Info Strip */}
      <div className="bg-[#F8F9FA] border border-[#E7E7E8] rounded-xl px-5 py-3 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E7E8] flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-[#009D77]" />
        </div>
        <p className="text-xs text-[#475467] font-medium">
          Daily Reset: Account renews to <span className="font-bold text-[#009D77]">5 free credits</span> every midnight. 1 Interview = 5 Credits.
        </p>
      </div>

      {/* Pricing Cards - Shorter & No Motion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white border border-[#E7E7E8] rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all ${plan.popular ? 'ring-1 ring-[#EC4899] shadow-md' : 'shadow-sm hover:border-[#D0D5DD]'}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#EC4899] text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                Best Value
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: plan.bg }}>
                   <plan.icon className="w-5 h-5" style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#011813] uppercase tracking-wider leading-none mb-1">{plan.name}</h3>
                  <p className="text-xl font-black text-[#011813]">{plan.credits} Credits</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#011813]">${plan.price}</span>
                <p className="text-[10px] font-black text-[#475467] opacity-60 uppercase">USD</p>
              </div>
            </div>

            <p className="text-[12px] text-[#475467] mb-4 font-medium leading-relaxed">
              {plan.description}
            </p>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#F0F2F5] flex items-center justify-center shrink-0">
                    <Check className="w-2 h-2 text-[#011813]" />
                  </div>
                  <span className="text-xs font-semibold text-[#313233]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(plan.id)}
              disabled={loading}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-[0.98] disabled:opacity-50 ${
                plan.popular 
                ? 'bg-[#EC4899] text-white hover:bg-[#D81B60] shadow-md' 
                : 'bg-[#011813] text-white hover:bg-[#08241b] shadow-sm'
              }`}
            >
              {loading ? "Processing..." : `Upgrade Now`}
              {!loading && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 py-4 opacity-60">
         <p className="text-[10px] font-bold text-[#8D8E8F] uppercase tracking-widest leading-none">
          Secure Payments by
        </p>
        <div className="flex items-center gap-1.5 text-[#635BFF] font-black text-[11px]">
          <CreditCard className="w-3.5 h-3.5" /> STRIPE
        </div>
      </div>
    </div>
  );
};

export default Pricing;
