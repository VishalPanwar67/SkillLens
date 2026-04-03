import SkillRoadmap from "../models/skillRoadmap.model.js";
import { fetchYouTubeVideos } from "./youtube.service.js";
import { generateGeminiText } from "./gemini.service.js";

const SKILL_LABELS = {
  react: "React",
  nodejs: "Node.js",
  mongodb: "MongoDB",
  sql: "SQL",
  python: "Python",
  java: "Java",
  dsa: "Data Structures & Algorithms",
  restapi: "REST APIs",
  systemdesign: "System Design",
  git: "Git",
  javascript: "JavaScript",
  typescript: "TypeScript",
  express: "Express.js",
  redux: "Redux",
  tailwind: "Tailwind CSS",
};

const toLabel = (skill) => SKILL_LABELS[skill] || skill.charAt(0).toUpperCase() + skill.slice(1);

export const generateSkillRoadmap = async (userId, skill, userApiKey) => {

  const labels = {
    react: "React",
    nodejs: "Node.js",
    mongodb: "MongoDB",
    sql: "SQL",
    python: "Python",
    java: "Java",
    dsa: "Data Structures & Algorithms",
    restapi: "REST APIs",
    systemdesign: "System Design",
    git: "Git",
    javascript: "JavaScript",
    typescript: "TypeScript",
    express: "Express.js",
    redux: "Redux",
    tailwind: "Tailwind CSS",
  };

  const currentLabel = labels[skill.toLowerCase()] || skill.charAt(0).toUpperCase() + skill.slice(1);

  const systemPrompt = `You are an elite career coach specializing in ${currentLabel}. 
  Generate a comprehensive learning roadmap for: ${currentLabel}.
  Return ONLY valid JSON including steps, projects, and interview questions.`;

  const userPrompt = `Generate a learning roadmap for "${currentLabel}" with:
  1. 3-6 logical steps. Each step must have: title, description, estimatedTime (e.g. 2 hours, 1 day), docLink (official), projectIdea.
  2. 2-3 project recommendations with: title, description, difficulty (Beginner/Intermediate/Expert), outcome.
  3. 5-10 practice questions with: question, type (MCQ or Conceptual), options (required for MCQ), answer.
  
  JSON Schema:
  {
    "steps": [
      { "id": "step1", "title": "...", "description": "...", "estimatedTime": "...", "docLink": "...", "projectIdea": "..." }
    ],
    "projects": [
      { "title": "...", "description": "...", "difficulty": "...", "outcome": "..." }
    ],
    "questions": [
      { "question": "...", "type": "MCQ", "options": ["...", "..."], "answer": "..." },
      { "question": "...", "type": "Conceptual", "answer": "..." }
    ]
  }`;

  try {
    const rawText = await generateGeminiText({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
      responseMimeType: "application/json",
      apiKey: userApiKey,
    });
    const content = JSON.parse(rawText || "{}");

    const videos = await fetchYouTubeVideos(skill);
    const steps = (content.steps || []).map((step, idx) => ({
      ...step,
      id: `step_${idx + 1}`,
      done: false,
    }));

    const projects = (content.projects || []).map((proj, idx) => ({
      ...proj,
      id: `proj_${idx + 1}`,
      done: false,
    }));

    return await SkillRoadmap.findOneAndUpdate(
      { userId, skill: skill.toLowerCase() },
      {
        $set: {
          steps,
          projects,
          questions: content.questions || [],
          videos,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error(`Generation error:`, error);
    
    // High-quality hardcoded fallbacks for common skills
    const FALLBACK_DATA = {
      systemdesign: {
        steps: [
          { id: "s1", title: "Scalability Basics", description: "Learn about Vertical vs Horizontal scaling and Load Balancers.", estimatedTime: "4 hours", docLink: "https://systeminterview.com/", projectIdea: "Simulate a Load Balancer" },
          { id: "s2", title: "Caching Strategies", description: "Understand Redis, Memcached, and CDN usage.", estimatedTime: "1 day", docLink: "https://redis.io/docs/", projectIdea: "Add Caching to a Node API" },
          { id: "s3", title: "Database Sharding", description: "Learn how to split large databases across multiple servers.", estimatedTime: "2 days", docLink: "https://highscalability.com/", projectIdea: "Implement a basic Sharding logic" }
        ],
        projects: [
          { title: "URL Shortener", description: "Build a scalable TinyURL clone.", difficulty: "Intermediate", outcome: "A working URL shortening service with analytics." },
          { title: "Real-time Chat App", description: "Build a chat system using WebSockets.", difficulty: "Expert", outcome: "Low-latency messaging system." }
        ],
        questions: [
          { question: "What is the CAP theorem?", type: "Conceptual", answer: "Consistency, Availability, and Partition Tolerance." },
          { question: "When would you use a NoSQL database?", type: "Conceptual", answer: "For unstructured data or high write/read requirements." }
        ]
      },
      react: {
        steps: [
          { id: "s1", title: "JSX & Props", description: "Understand how to pass data and write UI logic.", estimatedTime: "2 hours", docLink: "https://react.dev", projectIdea: "Profile Card" },
          { id: "s2", title: "State & Hooks", description: "Master useState and useEffect for dynamic UI.", estimatedTime: "1 day", docLink: "https://react.dev/reference/react", projectIdea: "Weather Dashboard" }
        ],
        projects: [
          { title: "Task Manager", description: "A Trello-like drag-and-drop board.", difficulty: "Intermediate", outcome: "Portfolio-ready productivity tool." }
        ],
        questions: [
          { question: "What is Virtual DOM?", type: "Conceptual", answer: "A lightweight copy of the real DOM used for performance." }
        ]
      },
      redux: {
        steps: [
          { id: "s1", title: "Redux Fundamentals", description: "Learn about actions, reducers, and the global store.", estimatedTime: "4 hours", docLink: "https://redux.js.org/", projectIdea: "Simple counter with Redux" },
          { id: "s2", title: "Redux Toolkit (RTK)", description: "Modern way to write Redux using createSlice.", estimatedTime: "1 day", docLink: "https://redux-toolkit.js.org/", projectIdea: "Note taking app" }
        ],
        projects: [
          { title: "E-commerce Basket", description: "Build a cart system using Redux for state management.", difficulty: "Beginner", outcome: "A working shopping cart" },
          { title: "Social Feed App", description: "Implement a post feed with comments using RTK Query.", difficulty: "Intermediate", outcome: "Dynamic feed with caching" }
        ],
        questions: [
          { question: "What are the three pillars of Redux?", type: "Conceptual", answer: "Single source of truth, State is read-only, Changes are made with pure functions." }
        ]
      },
      html: {
        steps: [
          { id: "s1", title: "HTML5 Semantic Tags", description: "Learn header, footer, main, section, and article.", estimatedTime: "2 hours", docLink: "https://developer.mozilla.org/en-US/docs/Web/HTML", projectIdea: "Semantic Profile Page" },
          { id: "s2", title: "Forms & Validations", description: "Master input types, labels, and built-in validations.", estimatedTime: "4 hours", docLink: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form", projectIdea: "Registration Form" }
        ],
        projects: [
          { title: "Portfolio Static Site", description: "A multi-page static portfolio using only HTML5.", difficulty: "Beginner", outcome: "A complete professional profile site structure." }
        ],
        questions: [
           { question: "What does HTML stand for?", type: "MCQ", options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlink Text Markup Language"], answer: "HyperText Markup Language" }
        ]
      },
      css: {
        steps: [
          { id: "s1", title: "Flexbox & Grid", description: "Modern layout techniques for responsive design.", estimatedTime: "1 day", docLink: "https://developer.mozilla.org/en-US/docs/Web/CSS", projectIdea: "Responsive Photo Gallery" },
          { id: "s2", title: "CSS Variables (Custom Properties)", description: "How to use variables for theme management.", estimatedTime: "4 hours", docLink: "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties", projectIdea: "Dark Mode Toggle Structure" }
        ],
        projects: [
           { title: "Modern Landing Page", description: "Build a fully responsive landing page with Flexbox and Grid.", difficulty: "Intermediate", outcome: "Mobile-first responsive design." }
        ],
        questions: [
           { question: "What is specificity in CSS?", type: "Conceptual", answer: "The hierarchy used by browsers to decide which CSS property values are most relevant to an element." }
        ]
      }
    };

    const curated = FALLBACK_DATA[skill.toLowerCase()] || {
      steps: [
        { id: 's1', title: 'Getting Started with ' + currentLabel, description: 'Learn the foundational concepts and setup your environment.', estimatedTime: '1 day', docLink: 'https://google.com', projectIdea: 'Setup project workspace', done: false },
        { id: 's2', title: 'Core Concepts Mastery', description: 'Deep dive into ' + currentLabel + ' syntax and patterns.', estimatedTime: '2 days', docLink: 'https://docs.google.com', projectIdea: 'Mini Implementation', done: false },
        { id: 's3', title: 'Advanced Implementation', description: 'Master large-scale ' + currentLabel + ' implementations.', estimatedTime: '3 days', docLink: 'https://google.com', projectIdea: 'Advanced Prototype', done: false }
      ],
      projects: [
        { title: 'Mini Demo', description: 'Create a small proof-of-concept application to master basic syntax.', difficulty: 'Beginner', outcome: 'Working prototype' },
        { title: 'Feature Rich App', description: 'Build a fully functional application with multiple features.', difficulty: 'Intermediate', outcome: 'Full-stack application' },
        { title: 'Performance Scaler', description: 'Optimize your project for scale and heavy load.', difficulty: 'Expert', outcome: 'Cloud-ready system' }
      ],
      questions: [
        { question: 'What are the main benefits of ' + currentLabel + '?', type: 'Conceptual', answer: 'Efficiency, modularity, and high demand in the industry.' },
        { question: 'How do you troubleshoot common issues in ' + currentLabel + '?', type: 'Conceptual', answer: 'By using debugging tools and following best practices.' }
      ]
    };

    const videos = await fetchYouTubeVideos(skill);
    
    const projects = (curated.projects || []).map((p, i) => ({ ...p, id: `p${i+1}`, done: false }));
    const steps = (curated.steps || []).map(s => ({ ...s, done: false }));

    return await SkillRoadmap.findOneAndUpdate(
       { userId, skill: skill.toLowerCase() },
       { 
         $set: { 
            steps: steps, 
            videos: videos, 
            projects: projects,
            questions: curated.questions,
            overallProgress: 0
         } 
       },
       { upsert: true, returnDocument: 'after' }
    );
  }
};

export const getDailyStudyPlan = async (skill, days, userApiKey) => {
  const prompt = `Generate a ${days}-day study plan for ${skill}. Return JSON: { "plan": [{ "day": 1, "tasks": "...", "goal": "..." }] }.`;

  try {
    const rawText = await generateGeminiText({
      prompt,
      temperature: 0.5,
      responseMimeType: "application/json",
      apiKey: userApiKey,
    });
    return JSON.parse(rawText || "{}").plan || [];
  } catch (error) {
    return [];
  }
};
