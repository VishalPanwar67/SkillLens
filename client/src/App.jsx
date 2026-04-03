import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Resume from "./pages/Resume.jsx";
import Quiz from "./pages/Quiz.jsx";
import Results from "./pages/Results.jsx";
import Match from "./pages/Match.jsx";
import Company from "./pages/Company.jsx";
import Interview from "./pages/Interview.jsx";
import Summary from "./pages/Summary.jsx";
import Roadmap from "./pages/Roadmap.jsx";
import Home from "./pages/Home.jsx";
import SkillLearning from "./pages/SkillLearning.jsx";
import Pricing from "./pages/Pricing.jsx";
import Success from "./pages/Success.jsx";
import Cancel from "./pages/Cancel.jsx";

function AppContent() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isPublicPage = location.pathname === "/" || location.pathname === "/login";

  return (
    <div className="flex min-h-screen bg-white">
      {!isPublicPage && (
        <>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <MobileNav onMenuClick={() => setIsSidebarOpen(true)} />
        </>
      )}
      
      <main className={`flex-1 min-h-screen w-full min-w-0 transition-all duration-300 ${
        !isPublicPage 
          ? 'pt-[64px] lg:pt-0 p-4 sm:p-6 lg:p-8 lg:ml-[260px]' 
          : ''
      }`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/match" element={<Match />} />
          <Route path="/company" element={<Company />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/learning" element={<SkillLearning />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment/success" element={<Success />} />
          <Route path="/payment/cancel" element={<Cancel />} />
          <Route
            path="*"
            element={
              <div className="max-w-5xl mx-auto space-y-4 p-8">
                <p className="text-xs text-[#8D8E8F]">Home / Not found</p>
                <h1 className="text-3xl font-extrabold text-[#011813] tracking-tight">
                  404 — Page not found
                </h1>
                <p className="text-sm text-[#313233] leading-relaxed">
                  The page you requested does not exist.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
