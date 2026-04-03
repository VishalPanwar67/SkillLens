import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../utils/apiFetch";
import { useRequireApiKey } from "../../hooks/useRequireApiKey";
import ApiKeyModal from "../ApiKeyModal";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Mic, 
  Settings,
  MoreVertical,
  ShieldCheck,
  ChevronRight,
  Brain
} from "lucide-react";

export default function MockInterviewChat({ skill, onClose }) {
  const [messages, setMessages] = useState([
    { role: "ai", content: `Hello! I'm your AI Interviewer. I'll be assessing your knowledge of ${skill}. Are you ready to begin?` }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const { showModal, setShowModal, checkKey } = useRequireApiKey();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!checkKey()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { 
        Authorization: `Bearer ${token}`,
      };

      const res = await apiFetch("/api/skill-roadmap/mock-interview", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          skill, 
          userMessage: input,
          chatHistory: messages 
        })
      });

      if (res.ok) {
        const result = await res.json();
        setMessages(prev => [...prev, { role: "ai", content: result.data }]);
      } else {
        throw new Error("Interview service error");
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "Oops, something went wrong with the connection. Let's try again." }]);
    } finally {
      setIsTyping(false);
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#011813] border border-white/20 rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#009D77] rounded-2xl flex items-center justify-center shadow-lg shadow-[#009D77]/20 border border-white/20 relative">
                 <Bot className="w-6 h-6 text-white" />
                 <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#011813] rounded-full translate-x-1 -translate-y-1"></div>
              </div>
              <div>
                 <h3 className="text-lg font-black text-white leading-none uppercase tracking-tight">AI Skill Interview</h3>
                 <p className="text-[10px] font-black text-[#009D77] uppercase tracking-widest mt-1">Focusing on {skill}</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
           >
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
        >
           {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                    msg.role === 'ai' 
                    ? 'bg-[#009D77] border-white/10' 
                    : 'bg-[#EC4899] border-white/10'
                 }`}>
                    {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                 </div>
                 <div className={`max-w-[85%] p-5 rounded-2xl text-sm font-bold leading-relaxed shadow-sm ${
                    msg.role === 'ai' 
                    ? 'bg-white/10 text-white/90 border border-white/5 rounded-tl-none' 
                    : 'bg-[#EC4899] text-white rounded-tr-none'
                 }`}>
                    {msg.content}
                 </div>
              </div>
           ))}
           {isTyping && (
              <div className="flex items-start gap-4 animate-pulse">
                 <div className="w-8 h-8 rounded-lg bg-[#009D77] border border-white/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                 </div>
                 <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                 </div>
              </div>
           )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-white/10 bg-[#011813]">
           <div className="relative flex items-center gap-3">
              <input 
                autoFocus
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your answer, ask for feedback, or ask a question..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-white font-bold text-sm focus:outline-none focus:border-[#009D77] focus:ring-1 focus:ring-[#009D77] transition-all placeholder:text-white/20"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`absolute right-2 p-3 rounded-xl transition-all ${
                   input.trim() && !isTyping 
                   ? 'bg-[#009D77] text-white shadow-lg shadow-[#009D77]/40 hover:scale-110 active:scale-95' 
                   : 'bg-white/5 text-white/20'
                }`}
              >
                  <Send className="w-5 h-5" />
              </button>
           </div>
           <p className="text-[9px] font-black tracking-widest text-white/30 text-center mt-4 uppercase">AI Interviewer powered by Gemini-1.5-Flash</p>
        </div>
      </motion.div>
    </div>
  );
}
