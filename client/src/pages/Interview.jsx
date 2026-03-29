import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ShieldAlert, Cpu, Settings2, Loader2, MessageSquare, Volume2 } from 'lucide-react';

export default function Interview() {
  const [isRecording, setIsRecording] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [mode, setMode] = useState("audio"); // "audio" or "text"
  const [hasStarted, setHasStarted] = useState(false);

  // Use Speech Recognition and Synthesis
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition 
    ? new (window.SpeechRecognition || window.webkitSpeechRecognition)() 
    : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };
  }

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synth.speak(utterance);
  };

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:5800/api/interview", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setQuestions(data.data.questions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, []);

  const startInterview = () => {
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

  const handleNext = () => {
    if (mode === "audio" && !isRecording) {
      startRecording();
      return;
    }

    // Submit Log
    const currentQ = questions[currentIdx];
    
    const evaluateAnswer = (answer, ideal) => {
      if (!answer || answer.trim().length < 15) {
         return { rating: 1, sentiment: "poor", improvement: "Answer was too brief or completely irrelevant. You must provide detailed technical explanations." };
      }
      
      const answerWords = answer.toLowerCase().match(/\b\w+\b/g) || [];
      const idealWords = ideal.toLowerCase().match(/\b\w+\b/g) || [];
      const importantIdealWords = idealWords.filter(w => w.length > 3);
      
      const matchCount = importantIdealWords.filter(w => answerWords.includes(w)).length;
      const matchRatio = importantIdealWords.length > 0 ? (matchCount / importantIdealWords.length) : 0;

      if (matchRatio < 0.15) {
         return { rating: 2, sentiment: "incorrect", improvement: "Answer drifted off-topic and missed core technical concepts. Study the expected ideal answer carefully to understand the required terms." };
      } else if (matchRatio < 0.35) {
         return { rating: 3, sentiment: "average", improvement: "Good start, but missing some key technical depth. Try to explicitly mention specific frameworks and architectural terms." };
      } else if (matchRatio < 0.6) {
         return { rating: 4, sentiment: "good", improvement: "Very solid technical answer! To achieve perfection, cover edge cases and advanced considerations mentioned in the ideal answer." };
      } else {
         return { rating: 5, sentiment: "excellent", improvement: "Outstanding response! Perfect technical accuracy combined with thorough, real-world detail." };
      }
    };

    const evaluation = evaluateAnswer(transcript, currentQ.ideal);

    const newFeedback = {
      question: currentQ.question,
      ideal: currentQ.ideal,
      answer: transcript,
      sentiment: evaluation.sentiment,
      rating: evaluation.rating,
      improvement: evaluation.improvement
    };
    
    const updatedFeedback = [...feedback, newFeedback];
    setFeedback(updatedFeedback);
    
    if (isRecording) stopRecording();

    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      setTranscript("");
      setTimeout(() => speak(questions[nextIdx].question), 500);
    } else {
      localStorage.setItem('interview_feedback', JSON.stringify(updatedFeedback));
      window.location.href = '/summary';
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    recognition?.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition?.stop();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa]">
       <Loader2 className="w-12 h-12 animate-spin text-[#11b589]" />
    </div>
  );

  return (
    <div className="h-screen bg-[#F8F9FA] relative flex flex-col justify-center px-4 sm:px-6 overflow-hidden">
      <main className="w-full max-w-6xl mx-auto flex flex-col h-[88vh] max-h-[800px] gap-4 relative z-10">
        
        {/* Header Compact */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center bg-white border border-[#E7E7E8] rounded-2xl p-4 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-extrabold text-[#011813] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#009D77]" /> AI Technical Interview
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
          </div>
          <p className="text-xs font-semibold text-[#475467] hidden md:block">
            {hasStarted ? `Question ${currentIdx + 1} of ${questions.length}` : 'Ready to begin evaluation'}
          </p>
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
                       onChange={(e) => setTranscript(e.target.value)}
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
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${isRecording ? 'bg-[#EC4899] hover:bg-[#D93A86] text-white' : 'bg-[#009D77] hover:bg-[#008A68] text-white'}`}
                      >
                        <Mic className="w-4 h-4" />
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </button>
                    )}
                    <button 
                      onClick={handleNext}
                      disabled={!transcript && hasStarted}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${!transcript ? 'bg-[#F8F9FA] text-[#98A2B3] border border-[#E7E7E8] cursor-not-allowed' : 'bg-[#011813] text-white hover:bg-[#08241b]'}`}
                    >
                      Submit & Next Question
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
    </div>
  );
}
