import { ApiResponse } from "../class/index.class.js";

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]);
    }
    throw new Error("INTERVIEW_JSON_PARSE_FAILED");
  }
};

export const generateInterviewQuestions = async (topic) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const system = [
    "You are an expert technical interviewer.",
    "Return ONLY valid JSON.",
    "Generate 5 unique, challenging, and professional interview questions for the given topic.",
    "Each question must have a 'question' and an 'ideal' answer summary (at least 2-3 sentences).",
    "Ensure questions are fresh and not repetitive generic ones.",
    "Target seniority: Mid-Level to Senior Developer.",
  ].join(" ");

  const user = [
    `Topic: ${topic}`,
    "Generate a JSON with this schema:",
    "{",
    '  "questions": [',
    "    {",
    '      "question": "string",',
    '      "ideal": "string"',
    "    }",
    "  ]",
    "}",
  ].join("\n");

  // Try Gemini first if key exists
  if (geminiKey) {
    try {
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
          generationConfig: { temperature: 0.8, responseMimeType: "application/json" }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return safeJsonParse(content);
      }
    } catch (err) {
      console.warn("Gemini Failed, trying fallback...");
    }
  }

  // Try OpenAI if Gemini failed or key missing
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_ROADMAP_MODEL || "gpt-3.5-turbo",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          temperature: 0.8,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return safeJsonParse(content);
      }
    } catch (err) {
      console.warn("OpenAI Failed, falling back to local bank.");
    }
  }

  throw new Error("AI_GENERATION_UNAVAILABLE");
};

export const evaluateAnswer = async (question, answer, ideal) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const system = [
    "You are a strict technical interviewer.",
    "Evaluate the user's answer against the ideal answer.",
    "Be very strict. If the user says 'I don't know', 'skip', or similar, give a rating of 1 and a score of 0.",
    "Return JSON only.",
    "Schema: { 'rating': number (1-5), 'score': number (0-100), 'sentiment': string, 'critique': string (2-3 sentences) }",
    "Identify specific technical gaps.",
  ].join(" ");

  const user = `Question: ${question}\nIdeal Answer: ${ideal}\nUser Answer: ${answer}`;

  // Helper for AI calls
  const getAIResult = async () => {
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        if (res.ok) {
          const data = await res.json();
          return safeJsonParse(data?.candidates?.[0]?.content?.parts?.[0]?.text);
        }
      } catch (e) { console.error("Gemini Eval Failed", e); }
    }

    if (openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            response_format: { type: "json_object" }
          })
        });
        if (res.ok) {
          const data = await res.json();
          return safeJsonParse(data?.choices?.[0]?.message?.content);
        }
      } catch (e) { console.error("OpenAI Eval Failed", e); }
    }
    return null;
  };

  const result = await getAIResult();
  if (result) return result;

  // Fallback if AI fails
  const lowAnswer = (answer || "").toLowerCase();
  const evasive = ["don't know", "no idea", "skip", "pass", "not sure"].some(v => lowAnswer.includes(v));
  if (evasive || lowAnswer.length < 15) {
    return { rating: 1, score: 0, sentiment: "Poor", critique: "User failed to provide a technical answer or stated lack of knowledge." };
  }

  return { rating: 3, score: 50, sentiment: "Average", critique: "AI feedback unavailable. Answer checked via heuristic." };
};
