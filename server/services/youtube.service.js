export const fetchYouTubeVideos = async (skill) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const SKILL_VIDEOS = {
    react: [
      { id: "SqcY0GlvtPk", title: "React in 100 Seconds", channel: "Fireship" },
      { id: "bMknfKXIFA8", title: "React Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "hQAHSlTtcmY", title: "Learn React In 30 Minutes", channel: "Web Dev Simplified" }
    ],
    nodejs: [
      { id: "TlB_eWzAgkY", title: "Node.js in 100 Seconds", channel: "Fireship" },
      { id: "Oe421EPjeBE", title: "Node.js and Express.js Full Course", channel: "FreeCodeCamp.org" },
      { id: "fBNz5xF-Kx4", title: "Node.js Tutorial for Beginners", channel: "Programming with Mosh" }
    ],
    systemdesign: [
      { id: "m8I0G6Uz7lo", title: "System Design Interview Survival Guide", channel: "Fireship" },
      { id: "i7VvCH_o-pU", title: "System Design for Beginners", channel: "FreeCodeCamp.org" },
      { id: "SqcY0GlvtPk", title: "Scalability and System Design", channel: "Arpit Bhayani" }
    ],
    dsa: [
      { id: "rfscVS0vtbw", title: "Data Structures & Algorithms in 10 Minutes", channel: "Fireship" },
      { id: "8hly31CYzNQ", title: "Data Structures Easy to Advanced", channel: "FreeCodeCamp.org" },
      { id: "BBpAmxU_NQo", title: "Data Structures & Algorithms for Beginners", channel: "Programming with Mosh" }
    ],
    mongodb: [
      { id: "r9Qst5vLidY", title: "MongoDB in 100 Seconds", channel: "Fireship" },
      { id: "excFC9Z5vEw", title: "MongoDB Full Course", channel: "FreeCodeCamp.org" },
      { id: "W6NZfCO5SIk", title: "MongoDB Tutorial for Beginners", channel: "Programming with Mosh" }
    ],
    javascript: [
      { id: "PkZNo7MFNFg", title: "JavaScript Course for Beginners", channel: "FreeCodeCamp.org" },
      { id: "W6NZfCO5SIk", title: "JavaScript Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "hdI2bqOjy3c", title: "JavaScript in 100 Seconds", channel: "Fireship" }
    ],
    html: [
      { id: "kUMe1fh40nM", title: "HTML Full Course for Beginners", channel: "FreeCodeCamp.org" },
      { id: "Sal78ACtGTc", title: "HTML in 100 Seconds", channel: "Fireship" },
      { id: "ok-plXXHlWw", title: "HTML Tutorial for Beginners", channel: "Programming with Mosh" }
    ],
    css: [
      { id: "1Rs2ND1RYYk", title: "CSS Full Course", channel: "FreeCodeCamp.org" },
      { id: "6vbgZpPrKps", title: "CSS in 100 Seconds", channel: "Fireship" },
      { id: "OEV8gMkCHXQ", title: "CSS Tutorial for Beginners", channel: "Programming with Mosh" }
    ],
    sql: [
      { id: "HXV3zeQKqGY", title: "SQL Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "7S_tz1z_5bA", title: "SQL Full Course", channel: "FreeCodeCamp.org" },
      { id: "nAtAnm7_C2o", title: "SQL in 100 Seconds", channel: "Fireship" }
    ],
    python: [
      { id: "_uQrJ0TkZlc", title: "Python for Beginners", channel: "Programming with Mosh" },
      { id: "rfscVS0vtbw", title: "Python in 100 Seconds", channel: "Fireship" },
      { id: "eWRfhZUzrKm", title: "Python Full Course", channel: "FreeCodeCamp.org" }
    ],
    java: [
      { id: "grEKMHGYyz4", title: "Java Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "A74ToWfux6o", title: "Java Full Course", channel: "FreeCodeCamp.org" },
      { id: "l9AzO1FMgM8", title: "Java in 100 Seconds", channel: "Fireship" }
    ],
    git: [
      { id: "hwP7WQkmECE", title: "Git Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "8JJ101D3knE", title: "Git & GitHub Full Course", channel: "FreeCodeCamp.org" },
      { id: "apGV9Kg7ics", title: "Git in 100 Seconds", channel: "Fireship" }
    ],
    express: [
      { id: "SccSCuHhOw0", title: "Express.js Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "7H_QH9nipRL", title: "Express.js Full Course", channel: "FreeCodeCamp.org" },
      { id: "3fU24Z6H4Wk", title: "Express.js in 100 Seconds", channel: "Fireship" }
    ],
    tailwind: [
      { id: "lCxcTsOHrjo", title: "Tailwind CSS Full Course", channel: "FreeCodeCamp.org" },
      { id: "Mr0a5KyD6dU", title: "Tailwind CSS in 100 Seconds", channel: "Fireship" },
      { id: "UBOj6rqRUME", title: "Tailwind CSS Tutorial", channel: "Programming with Mosh" }
    ],
    redux: [
      { id: "poQXNp9It64", title: "Redux Tutorial for Beginners", channel: "Programming with Mosh" },
      { id: "9boMnmzBa98", title: "Redux Toolkit Full Course", channel: "FreeCodeCamp.org" },
      { id: "5yEG6GhoJBs", title: "Redux in 100 Seconds", channel: "Fireship" }
    ]
  };

  const skillKey = skill.toLowerCase();
  
  // If API key exists, use it for fresh search
  if (apiKey) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(skill + " tutorial roadmap")}&type=video&key=${apiKey}`;
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        return data.items.map((item) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
        }));
      }
    } catch (err) {
      console.error("YouTube Search failed:", err);
    }
  }

  // Fallback to Curated List
  const curated = SKILL_VIDEOS[skillKey] || [
    { id: "erEgovG9WkY", title: "Global Web Development Roadmap", channel: "Fireship" },
    { id: "v2itV9H0LWA", title: "Complete Learning Guide", channel: "Programming with Mosh" },
    { id: "zJSY8tbf_ys", title: "Strategic Career Guide", channel: "FreeCodeCamp.org" }
  ];
  
  return curated.map(v => ({
    videoId: v.id,
    title: v.title,
    channelName: v.channel,
    thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`
  }));
};
