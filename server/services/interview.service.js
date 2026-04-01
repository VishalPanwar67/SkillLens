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
