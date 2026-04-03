import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";

export default function MobileNav({ onMenuClick }) {
  const location = useLocation();
  const isPublicPage = location.pathname === "/" || location.pathname === "/login";

  if (isPublicPage) return null;

  return (
    <nav className="lg:hidden fixed top-0 left-0 w-full z-30 bg-white/80 backdrop-blur-md border-b border-[#E7E7E8] px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#E8FAF5] flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-[#009D77]" />
        </div>
        <span className="text-base font-extrabold tracking-tight">
          <span className="text-[#011813]">Skill</span>
          <span className="text-[#009D77]">Lens</span>
        </span>
      </Link>
      
      <button 
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-[#313233]" />
      </button>
    </nav>
  );
}
