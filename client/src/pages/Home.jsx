import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import { useHomePageInteractions } from "../hooks/useHomePageInteractions";

const FONT_LINKS = [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );

  useEffect(() => {
    const sync = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useHomePageInteractions(navigate);

  useEffect(() => {
    FONT_LINKS.forEach(({ rel, href, crossOrigin }) => {
      const existing = document.head.querySelector(`link[href="${href}"]`);
      if (existing) return;
      const linkEl = document.createElement("link");
      linkEl.setAttribute("rel", rel);
      linkEl.setAttribute("href", href);
      if (crossOrigin) linkEl.setAttribute("crossorigin", crossOrigin);
      document.head.appendChild(linkEl);
    });
  }, []);

  useEffect(() => {
    document.body.classList.add("skilllens-home-active");
    return () => document.body.classList.remove("skilllens-home-active");
  }, []);

  return (
    <div className="home-page">
      <div id="cursor"></div>
      <div id="cursor-ring"></div>

      <div id="scroll-bar" style={{ width: "0%" }}></div>

      <button
        type="button"
        id="back-top"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <svg viewBox="0 0 16 16" fill="none">
          <path
            d="M8 12V4M4 8l4-4 4 4"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div id="app">
        <nav className="nav" id="main-nav">
          <Link to="/" className="nav-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 16 16" fill="none">
                <rect
                  x="2"
                  y="2"
                  width="5"
                  height="5"
                  rx="1.2"
                  fill="#00C98A"
                />
                <rect
                  x="9"
                  y="2"
                  width="5"
                  height="5"
                  rx="1.2"
                  fill="#00C98A"
                />
                <rect
                  x="2"
                  y="9"
                  width="5"
                  height="5"
                  rx="1.2"
                  fill="#00C98A"
                />
                <rect
                  x="9"
                  y="9"
                  width="5"
                  height="5"
                  rx="1.2"
                  fill="rgba(0,201,138,.35)"
                />
              </svg>
            </div>
            SkillLens
          </Link>
          <div className="nav-center">
            <button type="button" className="nav-item">
              Platform
            </button>
            <button type="button" className="nav-item">
              How it works
            </button>
            <button type="button" className="nav-item">
              Success Stories
            </button>
          </div>
          <div className="nav-r">
            <button
              type="button"
              className="btn-nav-ghost"
              disabled={isAuthenticated}
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-nav-cta"
              disabled={!isAuthenticated}
              title={
                isAuthenticated ? undefined : "Sign in to use Get Started"
              }
              onClick={() => navigate("/dashboard")}
            >
              Get Started
            </button>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-left">
            <div className="hero-badge-wrap">
              <div className="badge">
                <div className="badge-dot"></div>
                <span className="badge-text">
                  AI Career Intelligence · Free Beta
                </span>
              </div>
            </div>
            <div className="hero-h1-wrap">
              <h1 className="hero-h1">
                Know where
                <br />
                you <span className="em-g">stand.</span>
                <br />
                Get hired <span className="em-p">faster.</span>
              </h1>
            </div>
            <div className="hero-p-wrap">
              <p className="hero-p">
                Resume parsing, adaptive quizzes, gap analysis, company matching
                — one tight AI loop built for developers who want to move fast
                and land better roles.
              </p>
            </div>
            <div className="hero-actions-wrap">
              <div className="hero-actions">
                <button type="button" className="btn btn-primary" id="hero-cta">
                  Start Evaluation
                  <svg
                    className="btn-arrow"
                    viewBox="0 0 14 14"
                    fill="none"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button type="button" className="btn btn-secondary">
                  <div className="play-wrap">
                    <svg viewBox="0 0 9 10" fill="none">
                      <path d="M2 1.5l5.5 3.5L2 8.5V1.5z" fill="#fff" />
                    </svg>
                  </div>
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="hero-trust-wrap">
              <div className="hero-trust">
                <div className="av-stack">
                  <div className="av av-g tooltip-wrap">
                    VP<span className="tooltip">Vikram P.</span>
                  </div>
                  <div className="av av-p tooltip-wrap">
                    AK<span className="tooltip">Arjun K.</span>
                  </div>
                  <div className="av av-v tooltip-wrap">
                    RS<span className="tooltip">Ritika S.</span>
                  </div>
                  <div className="av av-a tooltip-wrap">
                    MT<span className="tooltip">Mihir T.</span>
                  </div>
                </div>
                <span className="trust-label">
                  <strong>200+ developers</strong> already leveling up
                </span>
              </div>
            </div>
          </div>

          <div className="bento bento-wrap">
            <div className="bc bc-a">
              <div className="bc-a-num">
                72<sup>%</sup>
              </div>
              <div className="bc-a-lbl">Readiness Score</div>
              <div className="bc-a-sub">
                Backend Developer track · Updated now
              </div>
              <div className="bc-a-ring"></div>
              <div className="bc-a-ring2"></div>
            </div>
            <div className="bc bc-b">
              <div className="bc-b-num">3</div>
              <div className="bc-b-lbl">Company Matches</div>
              <div className="bc-b-rows">
                <div className="bc-b-row">
                  <span className="bc-b-name">Razorpay</span>
                  <span className="bc-b-pct">94%</span>
                </div>
                <div className="bc-b-row">
                  <span className="bc-b-name">CRED</span>
                  <span className="bc-b-pct">88%</span>
                </div>
                <div className="bc-b-row">
                  <span className="bc-b-name">Zepto</span>
                  <span className="bc-b-pct">79%</span>
                </div>
              </div>
            </div>
            <div className="bc bc-c">
              <div className="bc-inner-lbl">Detected Stack</div>
              <div className="sk-row">
                <span className="sk-name">React / Frontend</span>
                <div className="sk-track">
                  <div
                    className="sk-fill"
                    data-w="85"
                    style={{ background: "var(--g)" }}
                  ></div>
                </div>
                <span className="sk-pct" style={{ color: "var(--g)" }}>
                  85%
                </span>
              </div>
              <div className="sk-row">
                <span className="sk-name">Node.js / Backend</span>
                <div className="sk-track">
                  <div
                    className="sk-fill"
                    data-w="70"
                    style={{ background: "var(--g)" }}
                  ></div>
                </div>
                <span className="sk-pct" style={{ color: "var(--g)" }}>
                  70%
                </span>
              </div>
              <div className="sk-row">
                <span className="sk-name">System Design</span>
                <div className="sk-track">
                  <div
                    className="sk-fill"
                    data-w="48"
                    style={{ background: "var(--pk)" }}
                  ></div>
                </div>
                <span className="sk-pct" style={{ color: "var(--pk)" }}>
                  48%
                </span>
              </div>
              <div className="sk-row">
                <span className="sk-name">DSA &amp; Algorithms</span>
                <div className="sk-track">
                  <div
                    className="sk-fill"
                    data-w="60"
                    style={{ background: "var(--amber)" }}
                  ></div>
                </div>
                <span className="sk-pct" style={{ color: "var(--amber)" }}>
                  60%
                </span>
              </div>
            </div>
            <div className="bc bc-d">
              <div className="bc-inner-lbl">Quiz Preview</div>
              <div className="bc-q">
                Which HTTP method is idempotent but not safe?
              </div>
              <div className="bc-opts">
                <div className="bc-opt">A. GET</div>
                <div className="bc-opt correct">B. PUT</div>
                <div className="bc-opt">C. POST</div>
              </div>
            </div>
            <div className="bc bc-e">
              <div className="bc-inner-lbl">Your Roadmap</div>
              <div className="rm-steps">
                <div className="rm-step">
                  <div className="rm-dot done">01</div>
                  <div className="rm-lbl">Resume</div>
                </div>
                <div className="rm-step">
                  <div className="rm-dot active">02</div>
                  <div className="rm-lbl active">Quiz</div>
                </div>
                <div className="rm-step">
                  <div className="rm-dot todo">03</div>
                  <div className="rm-lbl">Match</div>
                </div>
                <div className="rm-step">
                  <div className="rm-dot todo">04</div>
                  <div className="rm-lbl">Roadmap</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="ticker-wrap">
          <div className="ticker-inner">
            <div className="ticker-item">
              <span className="ticker-num">2,400+</span>
              <span className="ticker-lbl">Resumes Analyzed</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">18K+</span>
              <span className="ticker-lbl">Quizzes Completed</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">94%</span>
              <span className="ticker-lbl">Reported Clarity</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">340+</span>
              <span className="ticker-lbl">Roles Matched</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">8 min</span>
              <span className="ticker-lbl">Avg Setup Time</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">100%</span>
              <span className="ticker-lbl">Free to Start</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">2,400+</span>
              <span className="ticker-lbl">Resumes Analyzed</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">18K+</span>
              <span className="ticker-lbl">Quizzes Completed</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">94%</span>
              <span className="ticker-lbl">Reported Clarity</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">340+</span>
              <span className="ticker-lbl">Roles Matched</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">8 min</span>
              <span className="ticker-lbl">Avg Setup Time</span>
            </div>
            <div className="ticker-sep"></div>
            <div className="ticker-item">
              <span className="ticker-num">100%</span>
              <span className="ticker-lbl">Free to Start</span>
            </div>
          </div>
        </div>

        <section className="features" id="features">
          <div className="sec-tag reveal">Platform Features</div>
          <h2 className="sec-h reveal reveal-d1">
            Everything to get you hired.
          </h2>
          <p className="sec-sub reveal reveal-d2">
            Six tightly integrated modules that take you from raw resume to
            role-ready — no spreadsheets, no guessing.
          </p>
          <div className="feat-grid">
            <div className="feat-card reveal scale-in reveal-d1">
              <div className="feat-icon fi-g">
                <svg viewBox="0 0 20 20" fill="none">
                  <rect
                    x="3"
                    y="2"
                    width="14"
                    height="16"
                    rx="2"
                    stroke="#00C98A"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M7 7h6M7 10.5h6M7 14h4"
                    stroke="#00C98A"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="feat-h">Resume Intelligence</div>
              <div className="feat-p">
                Upload once. AI extracts your full tech stack, experience depth,
                and flags gaps vs your target role instantly.
              </div>
              <span className="feat-pill pill-g">Auto-detect stack</span>
            </div>
            <div className="feat-card reveal scale-in reveal-d2">
              <div className="feat-icon fi-g">
                <svg viewBox="0 0 20 20" fill="none">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="#00C98A"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M10 6v4l3 2"
                    stroke="#00C98A"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="feat-h">Adaptive Quiz Engine</div>
              <div className="feat-p">
                AI-calibrated questions that adjust to your level in real time.
                Every quiz is tuned to your detected stack.
              </div>
              <span className="feat-pill pill-g">Adaptive difficulty</span>
            </div>
            <div className="feat-card reveal scale-in reveal-d3 pink">
              <div className="feat-icon fi-p">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 16L10 5l6 11"
                    stroke="#EA4C89"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.5 12.5h7"
                    stroke="#EA4C89"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="feat-h">Company Match</div>
              <div className="feat-p">
                See which companies your skill profile aligns with — scored,
                ranked, with gap analysis per role.
              </div>
              <span className="feat-pill pill-p">Real job data</span>
            </div>
            <div className="feat-card reveal scale-in reveal-d4 pink">
              <div className="feat-icon fi-p">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M6 15V9M9.5 15V6M13 15V9M16.5 15V11.5"
                    stroke="#EA4C89"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="feat-h">Interview Simulation</div>
              <div className="feat-p">
                Practice with role-specific technical + behavioral questions.
                Get scored answers with reasoning feedback.
              </div>
              <span className="feat-pill pill-p">AI feedback</span>
            </div>
            <div className="feat-card reveal scale-in reveal-d5">
              <div className="feat-icon fi-g">
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 17V12M7.5 17V7M11 17V11M14.5 17V5"
                    stroke="#00C98A"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="feat-h">Learning Roadmap</div>
              <div className="feat-p">
                A prioritized study plan from your gaps — not a generic course
                list. Week-by-week, built for your schedule.
              </div>
              <span className="feat-pill pill-g">Personalized plan</span>
            </div>
            <div className="feat-card reveal scale-in reveal-d6">
              <div className="feat-icon fi-v">
                <svg viewBox="0 0 20 20" fill="none">
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="#7C3AED"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M7 10l2.5 2.5L13 8"
                    stroke="#7C3AED"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="feat-h">Progress Analytics</div>
              <div className="feat-p">
                Track readiness score over time. See exactly how each quiz,
                resource, and session moves your profile forward.
              </div>
              <span className="feat-pill pill-v">Score history</span>
            </div>
          </div>
        </section>

        <div className="workflow" id="workflow">
          <div className="workflow-inner">
            <div className="sec-tag reveal">How it works</div>
            <h2 className="sec-h reveal reveal-d1">
              From resume to offer
              <br />
              in 4 steps.
            </h2>
            <div className="wf-grid">
              <div className="wf-step reveal reveal-d2">
                <div className="wf-num green">01</div>
                <div className="wf-h">Upload Resume</div>
                <div className="wf-p">
                  Drop your PDF. AI detects your full stack, experience depth,
                  and role alignment in seconds.
                </div>
              </div>
              <div className="wf-step reveal reveal-d3">
                <div className="wf-num green">02</div>
                <div className="wf-h">Take Skill Quiz</div>
                <div className="wf-p">
                  Adaptive questions calibrate your actual knowledge level — not
                  just what's written on your CV.
                </div>
              </div>
              <div className="wf-step reveal reveal-d4">
                <div className="wf-num pink">03</div>
                <div className="wf-h">Match + Analyze</div>
                <div className="wf-p">
                  See your role fit, company matches, and exactly which gaps are
                  costing you interviews right now.
                </div>
              </div>
              <div className="wf-step reveal reveal-d5">
                <div className="wf-num pink">04</div>
                <div className="wf-h">Execute Roadmap</div>
                <div className="wf-p">
                  Follow your AI roadmap, practice interviews, and watch your
                  readiness score climb week over week.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="proof" id="proof">
          <div className="sec-tag reveal">Success Stories</div>
          <h2 className="sec-h reveal reveal-d1">Devs who used SkillLens.</h2>
          <div className="proof-grid">
            <div className="test-card reveal from-left reveal-d2">
              <div className="test-stars">
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
              </div>
              <div className="test-q">
                The gap analysis was eye-opening. I had no idea System Design
                was holding me back from senior roles until SkillLens showed me
                the exact delta.
              </div>
              <div className="test-divider"></div>
              <div className="test-author">
                <div
                  className="test-av"
                  style={{ background: "var(--g-l)", color: "var(--g-d)" }}
                >
                  AK
                </div>
                <div>
                  <div className="test-name">Arjun Kapoor</div>
                  <div className="test-role">Backend Engineer · Bangalore</div>
                </div>
                <span
                  className="test-badge"
                  style={{ background: "var(--g-l)", color: "var(--g-d)" }}
                >
                  +2 levels
                </span>
              </div>
            </div>
            <div className="test-card reveal reveal-d3">
              <div className="test-stars">
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
              </div>
              <div className="test-q">
                3 months of blind applications, then 1 week with SkillLens. I
                knew exactly which 2 companies matched me. Got an offer in 3
                weeks after that.
              </div>
              <div className="test-divider"></div>
              <div className="test-author">
                <div
                  className="test-av"
                  style={{ background: "var(--pk-l)", color: "var(--pk)" }}
                >
                  RS
                </div>
                <div>
                  <div className="test-name">Ritika Sharma</div>
                  <div className="test-role">Frontend Developer · Pune</div>
                </div>
                <span
                  className="test-badge"
                  style={{ background: "var(--pk-l)", color: "var(--pk)" }}
                >
                  Hired ✓
                </span>
              </div>
            </div>
            <div className="test-card reveal from-right reveal-d4">
              <div className="test-stars">
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
              </div>
              <div className="test-q">
                The adaptive quiz found DSA weak spots I thought I'd covered.
                The roadmap it built was exactly what I needed — no fluff, just
                the gaps.
              </div>
              <div className="test-divider"></div>
              <div className="test-author">
                <div
                  className="test-av"
                  style={{
                    background: "var(--violet-l)",
                    color: "var(--violet)",
                  }}
                >
                  MT
                </div>
                <div>
                  <div className="test-name">Mihir Tiwari</div>
                  <div className="test-role">Fullstack Dev · Indore</div>
                </div>
                <span
                  className="test-badge"
                  style={{
                    background: "var(--violet-l)",
                    color: "var(--violet)",
                  }}
                >
                  72→91%
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="cta-section">
          <div className="cta-inner reveal scale-in">
            <div className="cta-blob1"></div>
            <div className="cta-blob2"></div>
            <div className="cta-eyebrow">Start your evaluation today</div>
            <h2 className="cta-h">
              Your next role is one
              <br />
              <span>readiness score</span> away.
            </h2>
            <p className="cta-p">
              No credit card. No fluff. Just clarity on where you stand and a
              plan to get there.
            </p>
            <div className="cta-btns">
              <button type="button" className="btn-cta primary">
                Start Your Evaluation
              </button>
              <button type="button" className="btn-cta secondary">
                Watch Demo (Coming Soon)
              </button>
            </div>
            <div className="cta-note">
              Takes about 8 minutes · Free beta · Login required to preview your
              results
            </div>
          </div>
        </div>

        <footer className="footer">
          <div className="footer-logo">
            <div className="fmark">

              <svg viewBox="0 0 13 13" fill="none">
                <rect x="1" y="1" width="4" height="4" rx="1" fill="#08100d" />
                <rect x="8" y="1" width="4" height="4" rx="1" fill="#08100d" />
                <rect x="1" y="8" width="4" height="4" rx="1" fill="#08100d" />
                <rect
                  x="8"
                  y="8"
                  width="4"
                  height="4"
                  rx="1"
                  fill="rgba(0,0,0,.4)"
                />
              </svg>
            </div>
            SkillLens
          </div>
          <div className="footer-links">
            <span className="footer-link">Platform</span>
            <span className="footer-link">Privacy</span>
            <span className="footer-link">Terms</span>
            <span className="footer-link">Contact</span>
          </div>
          <div className="footer-copy">
            © 2026 SkillLens. All rights reserved.
          </div>
          <div className="footer-socials">
            <div className="fsoc">
              <svg viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 3.5h10M2 7h10M2 10.5h6"
                  stroke="rgba(255,255,255,.4)"
                  strokeWidth=".9"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="fsoc">
              <svg viewBox="0 0 14 14" fill="none">
                <rect
                  x="2"
                  y="2"
                  width="10"
                  height="10"
                  rx="3"
                  stroke="rgba(255,255,255,.4)"
                  strokeWidth=".9"
                />
                <circle
                  cx="7"
                  cy="7"
                  r="2.2"
                  stroke="rgba(255,255,255,.4)"
                  strokeWidth=".9"
                />
                <circle cx="10.2" cy="3.8" r=".6" fill="rgba(255,255,255,.4)" />
              </svg>
            </div>
            <div className="fsoc">
              <svg viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2.5l4.5 5.5L2 12h1.5l3.7-3.9L10.5 12H13l-4.8-5.8L13 2.5h-1.5L6.9 6.1 3.5 2.5H2z"
                  fill="rgba(255,255,255,.4)"
                />
              </svg>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
