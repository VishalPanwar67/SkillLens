import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequireApiKey } from '../hooks/useRequireApiKey';
import { apiFetch } from '../utils/apiFetch';
import ApiKeyModal from '../components/ApiKeyModal';
import { motion } from 'framer-motion';
import { Mic, ShieldAlert, Cpu, Settings2, Loader2, MessageSquare, Volume2, Zap, AlertCircle, X, ChevronRight } from 'lucide-react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function Interview() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [speechSupported, setSpeechSupported] = useState(!!SpeechRecognition);
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const transcriptRef = useRef('');

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [mode, setMode] = useState("audio"); // "audio" or "text"
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topics] = useState([
    "React", "HTML", "CSS", "Node.js", "Java", "JavaScript", "MongoDB", "Git", "Python", "OOPS",
    "SQL", "OS", "C", "C++", "Spring Boot", "Hibernate", "DSA", "System Design"
  ]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { showModal, setShowModal, checkKey } = useRequireApiKey();

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  /** One SpeechRecognition instance for the whole session — must not be recreated each render. */
  useEffect(() => {
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // `results` holds the full session buffer; build full text from every segment (fixes dropped words).
      let line = '';
      for (let i = 0; i < event.results.length; i++) {
        line += event.results[i][0].transcript;
      }
      const t = line.trim();
      transcriptRef.current = t;
      setTranscript(t);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      setSpeechError(
        event.error === 'not-allowed'
          ? 'Microphone blocked — allow mic access for this site in the browser address bar.'
          : event.error === 'network'
            ? 'Speech recognition could not reach Google’s servers (offline, VPN/firewall, or Brave Shields blocking the request). In Brave: lion icon → Shields down for this site, or use Text mode.'
            : `Voice: ${event.error}`
      );
    };

    recognition.onend = () => {
      // After a pause, Chrome ends the session; restart if user still wants to record.
      if (!isRecordingRef.current) return;
      restartTimerRef.current = window.setTimeout(() => {
        if (!isRecordingRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.start();
        } catch (e) {
          if (e.name !== 'InvalidStateError') console.warn('SpeechRecognition restart:', e);
        }
      }, 120);
    };

    recognitionRef.current = recognition;
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognition.abort();
      } catch {
        try {
          recognition.stop();
        } catch {
          /* noop */
        }
      }
      recognitionRef.current = null;
    };
  }, []);

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synth.speak(utterance);
  };

  const fetchInterview = async (topic) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const path = topic
        ? `/api/interview?topic=${encodeURIComponent(topic)}`
        : "/api/interview";

      const res = await apiFetch(path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.status === 403 && data.data?.needsCredits) {
        setShowCreditModal(true);
        return;
      }

      if (data.success) {
        setQuestions(data.data.questions);
        // Refresh credits in local view if possible or just assume consumption
      }
    } catch (err) {
      console.error(err);
      alert("Error starting interview. Please check your credit balance.");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic) => {
    if (!checkKey()) return;
    setSelectedTopic(topic);
    fetchInterview(topic);
  };

  const startInterview = () => {
    if (!checkKey()) return;
    setHasStarted(true);
    if (questions.length > 0) {
       speak(questions[0].question);
    }
  };

  const repeatQuestion = () => {
    if (questions.length > 0 && questions[currentIdx]) {
      // Cancel any ongoing speech before repeating
      window.speechSynthesis.cancel();
      speak(questions[currentIdx].question);
    }
  };

  const handleNext = async () => {
    if (!transcript?.trim()) return;

    if (mode === "audio" && isRecording) {
      stopRecording();
      await new Promise((r) => setTimeout(r, 220));
    }

    const answerText = (transcriptRef.current || transcript).trim();
    if (!answerText) return;

    setSubmitting(true);
    const currentQ = questions[currentIdx];
    
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch("/api/interview/evaluate", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          question: currentQ.question,
          answer: answerText,
          ideal: currentQ.ideal
        })
      });
      
      const data = await res.json();
      const evaluation = data.success ? data.data : {
        rating: (answerText.toLowerCase().includes("know") || answerText.length < 20) ? 1 : 2,
        sentiment: "Poor",
        critique: "Validation failed. Response was either evasive or lacked technical substance."
      };

      const newFeedback = {
        question: currentQ.question,
        ideal: currentQ.ideal,
        answer: answerText,
        sentiment: evaluation.sentiment,
        rating: evaluation.rating,
        critique: evaluation.critique,
        improvement: evaluation.critique,
        score: evaluation.score || 0
      };
      
      const updatedFeedback = [...feedback, newFeedback];
      setFeedback(updatedFeedback);

      const nextIdx = currentIdx + 1;
      if (nextIdx < questions.length) {
        setCurrentIdx(nextIdx);
        setTranscript("");
        transcriptRef.current = '';
        setSpeechError(null);
        setTimeout(() => speak(questions[nextIdx].question), 500);
      } else {
        localStorage.setItem('interview_feedback', JSON.stringify(updatedFeedback));
        setTimeout(() => navigate('/summary'), 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const startRecording = useCallback(() => {
    setSpeechError(null);
    const rec = recognitionRef.current;
    if (!rec) {
      setSpeechError('Speech recognition is not available. Use Text mode or open this app in Chrome or Edge.');
      return;
    }
    try {
      isRecordingRef.current = true;
      rec.start();
      setIsRecording(true);
    } catch (e) {
      isRecordingRef.current = false;
      if (e?.name === 'InvalidStateError') {
        setIsRecording(true);
        isRecordingRef.current = true;
      } else {
        setSpeechError(e?.message || 'Could not start the microphone.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    }
  }, []);

  useEffect(() => {
    if (mode === 'text' && isRecording) stopRecording();
  }, [mode, isRecording, stopRecording]);

  const topicIcons = {
    "React": <Cpu className="w-6 h-6" />,
    "HTML": <Cpu className="w-6 h-6" />,
    "CSS": <Cpu className="w-6 h-6" />,
    "Node.js": <Cpu className="w-6 h-6" />,
    "Java": <Cpu className="w-6 h-6" />,
    "JavaScript": <Cpu className="w-6 h-6" />,
    "MongoDB": <Cpu className="w-6 h-6" />,
    "Git": <Cpu className="w-6 h-6" />,
    "Python": <Cpu className="w-6 h-6" />,
    "OOPS": <Cpu className="w-6 h-6" />,
    "SQL": <Cpu className="w-6 h-6" />,
    "OS": <Cpu className="w-6 h-6" />,
    "C": <Cpu className="w-6 h-6" />,
    "C++": <Cpu className="w-6 h-6" />,
    "Spring Boot": <Cpu className="w-6 h-6" />,
    "Hibernate": <Cpu className="w-6 h-6" />,
    "DSA": <Cpu className="w-6 h-6" />,
    "System Design": <Cpu className="w-6 h-6" />
  };

  if (!selectedTopic) {
    return (
      <>
      {showModal && (
        <ApiKeyModal
          required={true}
          onSuccess={() => setShowModal(false)}
        />
      )}
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl bg-white border border-[#E7E7E8] rounded-[1.5rem] p-6 shadow-xl text-center relative overflow-hidden"
        >
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#009D77]/5 to-transparent rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#EC4899]/5 to-transparent rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-[#009D77] to-[#007D5F] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#009D77]/20 transform transition-transform hover:rotate-3">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            
            <h1 className="text-2xl font-extrabold text-[#011813] mb-1 tracking-tight">Technical Validator</h1>
            <p className="text-[#475467] text-sm font-medium mb-6 max-w-md mx-auto">
              Select your domain to begin AI-powered evaluation.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  className="group relative h-20 flex flex-col items-center justify-center gap-1 rounded-xl border border-[#F1F1F2] bg-white transition-all duration-200 hover:border-[#009D77] hover:bg-[#E8FAF5] hover:shadow-md"
                >
                  <div className="text-[#98A2B3] group-hover:text-[#009D77] transition-colors scale-75 group-hover:scale-90 duration-200">
                    {topicIcons[topic] || <Settings2 className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-[10px] uppercase tracking-wide text-[#475467] group-hover:text-[#011813]">
                    {topic}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1F1F2] flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#009D77]" />
                <span className="text-[9px] font-bold text-[#475467] uppercase tracking-wider">Dynamic Bank</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
                <span className="text-[9px] font-bold text-[#475467] uppercase tracking-wider">AI Powered</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
       <div className="text-center">
         <Loader2 className="w-12 h-12 animate-spin text-[#11b589] mx-auto mb-4" />
         <p className="text-[#475467] font-bold text-sm uppercase tracking-widest">Loading questions for {selectedTopic}...</p>
       </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F8F9FA] relative flex flex-col justify-center px-4 sm:px-6 overflow-hidden">
      {showModal && (
        <ApiKeyModal
          required={true}
          onSuccess={() => setShowModal(false)}
        />
      )}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#011813]/25 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-8 py-6 shadow-xl border border-[#E7E7E8]">
            <Loader2 className="w-10 h-10 animate-spin text-[#009D77]" />
            <p className="text-xs font-bold text-[#475467] uppercase tracking-wider">Scoring your answer…</p>
          </div>
        </div>
      )}
      <main className="w-full max-w-6xl mx-auto flex flex-col h-[88vh] max-h-[800px] gap-4 relative z-10">
        
        {/* Header Compact */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-white border border-[#E7E7E8] rounded-2xl p-4 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold text-[#011813] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#009D77]" /> {selectedTopic} Interview
            </h1>
            <div className="h-4 w-px bg-[#E7E7E8]" />
            <div className="flex bg-[#F8F9FA] p-1 rounded-lg border border-[#E7E7E8]">
              <button 
                onClick={() => setMode('audio')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${mode === 'audio' ? 'bg-[#009D77] text-white shadow-sm' : 'text-[#475467] hover:text-[#011813]'}`}
              >
                Audio
              </button>
              <button 
                onClick={() => setMode('text')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${mode === 'text' ? 'bg-[#009D77] text-white shadow-sm' : 'text-[#475467] hover:text-[#011813]'}`}
              >
                Text
              </button>
            </div>
            <button 
                onClick={() => setSelectedTopic(null)}
                className="text-[10px] font-bold uppercase tracking-wider text-[#EC4899] hover:underline"
              >
                Change Topic
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#E8FAF5] border border-[#009D77]/20 px-3 py-1.5 rounded-full flex items-center gap-2">
               <Zap className="w-3 h-3 text-[#009D77]" />
               <span className="text-[10px] font-black text-[#009D77] uppercase tracking-tighter">-5 Credits</span>
            </div>
            <p className="text-xs font-semibold text-[#475467] hidden md:block">
              {hasStarted ? `Question ${currentIdx + 1} of ${questions.length}` : 'Ready to begin evaluation'}
            </p>
          </div>
        </motion.div>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          
          {/* Left: Robot & Question View */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-[45%] bg-white border border-[#E7E7E8] rounded-2xl overflow-hidden shadow-sm flex flex-col relative"
          >
            {/* Robot Image Container */}
            <div className="relative flex-1 bg-gray-100 flex items-center justify-center p-6 border-b border-[#E7E7E8] overflow-hidden group">
              {/* Subtle pulsing background for realism */}
              <div className={`absolute inset-0 bg-[#009D77]/5 transition-opacity duration-700 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`} />
              
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-lg z-10">
                <motion.img 
                  animate={isSpeaking ? { y: [0, -4, 0, -2, 0], scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={isSpeaking ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 }}
                  src="/friendly_robot.png" 
                  alt="AI Interviewer" 
                  className="w-full h-full object-cover origin-bottom transform-gpu bg-white" 
                />
                
                {/* Speaking indicator ring */}
                {isSpeaking && (
                   <div className="absolute inset-0 border-4 border-[#009D77] rounded-full animate-ping opacity-20 pointer-events-none" />
                )}

                {/* Animated Cybernetic Mouth Equalizer */}
                <div className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 flex items-center gap-1 transition-opacity duration-300 pointer-events-none ${isSpeaking ? 'opacity-90' : 'opacity-0'}`}>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={isSpeaking ? { height: ['4px', `${Math.random() * 16 + 8}px`, '4px'] } : { height: '4px' }}
                      transition={{ 
                        duration: 0.2 + (i * 0.05), 
                        repeat: Infinity, 
                        repeatType: 'mirror',
                        ease: "linear"
                      }}
                      className="w-1.5 bg-[#009D77] rounded-full shadow-[0_0_8px_#009D77]"
                    />
                  ))}
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-[#E7E7E8] px-3 py-1.5 rounded-lg shadow-sm z-20 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-[#EC4899] animate-pulse' : 'bg-[#009D77]'}`} />
                <span className="text-[10px] font-bold text-[#011813] uppercase">
                  {isSpeaking ? 'Asking...' : hasStarted ? 'Listening Focus' : 'Standby'}
                </span>
              </div>
            </div>

            {/* Current Question Block */}
            <div className="h-1/3 min-h-[140px] bg-[#F8F9FA] p-6 flex flex-col justify-center">
               <h3 className="text-[10px] font-bold text-[#009D77] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Interviewer Asks:
               </h3>
               <p className="text-[#011813] font-bold text-lg md:text-xl leading-snug">
                 {hasStarted ? `"${questions[currentIdx]?.question}"` : 'Your technical evaluation is ready. Initialize when prepared.'}
               </p>
            </div>
          </motion.div>

          {/* Right: Input & Controls View */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-[55%] flex flex-col gap-4"
          >
            {mode === 'audio' && hasStarted && (
              <div className="space-y-2 shrink-0">
                {!speechSupported && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-950">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Speech recognition is not supported in this browser. Use <strong>Text</strong> mode, or open the app in <strong>Chrome</strong> or <strong>Edge</strong> (desktop).
                    </span>
                  </div>
                )}
                {speechError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-900">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{speechError}</span>
                  </div>
                )}
              </div>
            )}
            {/* Transcript/Input Box */}
            <div className="bg-white border border-[#E7E7E8] rounded-2xl flex-1 shadow-sm flex flex-col relative overflow-hidden">
               <div className="p-4 border-b border-[#E7E7E8] bg-[#F8F9FA] flex justify-between items-center shrink-0">
                  <h3 className="text-[11px] font-bold text-[#475467] uppercase tracking-wider">
                    {mode === 'audio' ? 'Live Speech Transcript' : 'Type Your Answer'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasStarted && (
                      <button 
                        onClick={repeatQuestion} 
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-[#009D77] border border-[#009D77] hover:bg-[#E8FAF5] transition-colors shadow-sm"
                        title="Repeat Question"
                      >
                        <Volume2 className="w-3 h-3" /> Re-Listen
                      </button>
                    )}
                    <div className={`px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${isRecording ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-white border border-[#E7E7E8] text-[#98A2B3]'}`}>
                      {mode === 'audio' ? (isRecording ? '● Voice Active' : 'Mic Off') : 'Keyboard'}
                    </div>
                  </div>
               </div>

               <div className="flex-1 p-5 relative overflow-y-auto">
                 {mode === "audio" ? (
                    transcript ? (
                      <div className="bg-[#E8FAF5] border border-[rgba(0,157,119,0.12)] p-4 rounded-xl inline-block max-w-[90%]">
                        <p className="text-[#011813] text-sm font-semibold leading-relaxed">
                          "{transcript}"
                        </p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-14 h-14 bg-[#F8F9FA] border border-[#E7E7E8] rounded-full flex items-center justify-center mb-3">
                          <Mic className="w-6 h-6 text-[#98A2B3]" />
                        </div>
                        <p className="text-[#475467] font-semibold text-sm">Waiting for voice input...</p>
                        <p className="text-[#98A2B3] text-xs mt-1">Press the action button below and speak clearly.</p>
                      </div>
                    )
                 ) : (
                    <textarea 
                       value={transcript}
                       onChange={(e) => {
                         const v = e.target.value;
                         transcriptRef.current = v;
                         setTranscript(v);
                       }}
                       placeholder="Describe your approach, technical choices, and specific examples here..."
                       className="w-full h-full bg-transparent border-none focus:ring-0 outline-none font-medium text-[#011813] text-sm resize-none placeholder:text-[#98A2B3]"
                    />
                 )}
               </div>
            </div>

            {/* Action Area */}
            <div className="bg-white border border-[#E7E7E8] rounded-2xl p-5 shadow-sm shrink-0 flex flex-col gap-4">
               {!hasStarted ? (
                  <button 
                    onClick={startInterview}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-[#009D77] hover:bg-[#008A68] text-white shadow-sm"
                  >
                    Begin Interview Validation
                  </button>
               ) : (
                  <div className="flex gap-3">
                    {mode === 'audio' && (
                      <button 
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!speechSupported}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${!speechSupported ? 'bg-[#E7E7E8] text-[#98A2B3] cursor-not-allowed' : isRecording ? 'bg-[#EC4899] hover:bg-[#D93A86] text-white' : 'bg-[#009D77] hover:bg-[#008A68] text-white'}`}
                      >
                        <Mic className="w-4 h-4" />
                        {!speechSupported ? 'Voice unavailable' : isRecording ? 'Stop Recording' : 'Start Recording'}
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={handleNext}
                      disabled={(!transcript?.trim() && hasStarted) || submitting}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${!transcript?.trim() || submitting ? 'bg-[#F8F9FA] text-[#98A2B3] border border-[#E7E7E8] cursor-not-allowed' : 'bg-[#011813] text-white hover:bg-[#08241b]'}`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Scoring…
                        </>
                      ) : (
                        'Submit & Next Question'
                      )}
                    </button>
                  </div>
               )}

               {/* Progress Bar under buttons */}
               {hasStarted && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#F8F9FA] rounded-full overflow-hidden border border-[#E7E7E8]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        className="h-full bg-gradient-to-r from-[#009D77] to-[#EC4899]"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#475467] w-8 text-right">
                      {Math.round(((currentIdx + 1) / questions.length) * 100)}%
                    </span>
                  </div>
               )}
            </div>
            
            {/* Quick Tip Box */}
            <div className="bg-[#F8F9FA] border border-[#E7E7E8] p-4 rounded-xl flex items-start gap-3 shrink-0">
               <ShieldAlert className="w-4 h-4 text-[#EC4899] shrink-0 mt-0.5" />
               <div>
                 <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#EC4899] mb-0.5">Evaluation Metric</h4>
                 <p className="text-[11px] text-[#475467] font-medium leading-relaxed">
                   Be clear and concise. The system evaluates both **technical vocabularies** and **impact metrics** in your transcript.
                 </p>
               </div>
            </div>

          </motion.div>
        </div>
      </main>

      {/* Beautiful Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-[#011813]/60 backdrop-blur-md"
            onClick={() => setShowCreditModal(false)}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-[#009D77]/10"
          >
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8FAF5] rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFF0F6] rounded-full -ml-12 -mb-12" />

            <div className="relative p-8 text-center">
              <div className="w-16 h-16 bg-[#F8FAFF] border-4 border-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3">
                <Zap className="w-8 h-8 text-[#009D77]" />
              </div>

              <h2 className="text-2xl font-black text-[#011813] mb-3 tracking-tight">Insufficient Credits</h2>
              <p className="text-sm text-[#475467] font-medium leading-relaxed mb-8 px-4">
                Oops! You've used your daily credits. To continue with this <span className="text-[#009D77] font-bold">Premium Interview</span>, please upgrade your pack.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = "/pricing"}
                  className="w-full py-4 bg-[#011813] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#08241b] transition-all shadow-lg shadow-[#011813]/20 group"
                >
                  Buy More Credits <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={() => setShowCreditModal(false)}
                  className="w-full py-4 bg-white text-[#475467] border border-[#E7E7E8] rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Maybe Later
                </button>
              </div>

              <p className="mt-8 text-[10px] font-bold text-[#98A2B3] uppercase tracking-[0.2em]">
                Secure Payments via <span className="text-[#635BFF]">StripE</span>
              </p>
            </div>

            {/* Close btn */}
            <button 
              onClick={() => setShowCreditModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-[#98A2B3]" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
