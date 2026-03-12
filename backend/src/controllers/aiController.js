const { AppError } = require('../utils/errorHandler');

const MAX_PROMPT_LENGTH = 1500;

const systemPrompt = `You are an AI placement preparation assistant for engineering students.
Provide concise, practical guidance for DSA, interviews, resume, projects, and placement strategy.
Keep answers focused, helpful, and actionable. Use bullet points when listing steps.`;

// --- Google Gemini (free API) ---------------------------------------------------
const fetchGeminiReply = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Gemini] error:', err);
    return null;
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
};

// --- OpenAI (paid) ---------------------------------------------------------------
const fetchOpenAIReply = async (message) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.4,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[OpenAI] error:', err);
    return null;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
};

// --- Smart local fallback --------------------------------------------------------
const buildFallbackReply = (message) => {
  const q = message.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|greetings|good (morning|evening|afternoon))\b/.test(q)) {
    return "Hello! I am your placement prep assistant. Ask me anything about DSA, resume building, interview prep, system design, coding profiles, or career planning!";
  }

  // What can you do
  if (q.includes('who are you') || q.includes('what can you do') || q.includes('help me') || q.includes('what do you')) {
    return "I am your AI placement preparation assistant! I can help you with:\n- DSA / LeetCode strategy\n- Resume and ATS tips\n- Interview preparation (technical + HR)\n- System design concepts\n- Project ideas\n- Coding profile improvement\n- Placement roadmap & study plans";
  }

  // Resume / ATS / CV
  if (q.includes('ats') || q.includes('applicant tracking')) {
    return "ATS tips:\n- Use standard headings (Experience, Education, Skills)\n- Match keywords from the job description\n- Avoid tables, columns, images, or fancy fonts\n- Use .docx or simple PDF\n- Quantify achievements: 'reduced load time by 40%'";
  }
  if (q.includes('resume') || q.includes('cv')) {
    if (q.includes('project')) {
      return "Resume projects section:\n- List 2-3 strong projects with tech stack\n- Format: Project Name | Tech used | GitHub link\n- One impact line per project: 'Reduced API response time by 30%'\n- Prioritize full-stack, real-use-case, or DSA-heavy projects";
    }
    return "Resume essentials:\n- Keep it one page\n- Strong 2-line summary tailored per company\n- Projects with quantified results\n- Skills section with honest proficiency levels\n- Education + CGPA (if above 7.5)\n- GitHub, LinkedIn, LeetCode links in header";
  }

  // DSA topics
  if (q.includes('graph') || q.includes('bfs') || q.includes('dfs')) {
    return "Graph DSA tips:\n- Master BFS (shortest path, level order) and DFS (connected components, cycle detection)\n- Key patterns: Topological sort, Dijkstra, Union-Find\n- Practice: Number of Islands, Course Schedule, Word Ladder, Cheapest Flights Within K Stops";
  }
  if (q.includes('dynamic programming') || (q.includes('dp') && !q.includes('dropdown'))) {
    return "Dynamic Programming roadmap:\n1. Recursion ? Memoization ? Tabulation\n2. Patterns: 0/1 Knapsack, LCS, LIS, Matrix DP, Partition DP\n3. Key problems: Climbing Stairs, Coin Change, Longest Common Subsequence, Edit Distance, House Robber\nTip: Always define state clearly before coding";
  }
  if (q.includes('tree') || q.includes('binary search tree') || q.includes('bst')) {
    return "Trees in DSA:\n- Master: Traversals (inorder/preorder/postorder), BST operations, Height/Depth, LCA\n- Key problems: Diameter of tree, Balance check, Zigzag traversal, Serialize/Deserialize\n- Resource: take U forward, NeetCode tree playlist";
  }
  if (q.includes('array') || q.includes('string')) {
    return "Arrays & Strings — start here:\n- Two pointer, Sliding window, Prefix sum\n- Key problems: Two Sum, Maximum Subarray, 3Sum, Container With Most Water\n- Strings: Anagram, Palindrome, KMP pattern matching\n- Target: master 5 patterns, 3 problems each";
  }
  if (q.includes('dsa') || q.includes('data structure') || q.includes('algorithm') || q.includes('leetcode') || q.includes('competitive')) {
    return "DSA study plan:\n1. Arrays & Strings (Two pointer, Sliding window)\n2. Hashing & Maps\n3. Stack & Queue\n4. Recursion & Backtracking\n5. Trees & Graphs\n6. Dynamic Programming\n\nTool: LeetCode + NeetCode.io for pattern-based practice. Solve 2 problems daily minimum.";
  }

  // Interview
  if (q.includes('tell me about') || q.includes('self intro') || q.includes('introduction')) {
    return "Self-introduction formula (60 seconds):\n1. Name + degree + college\n2. Key tech skills (2-3)\n3. Best project (one line with impact)\n4. Why this company/role\n\nExample: 'I am [Name], a final-year CS student from [College]. I work with React and Node.js, and built a placement tracker used by 500+ students. I am excited about this role because...'";
  }
  if (q.includes('behavioral') || (q.includes('hr') && q.includes('question')) || q.includes('star method')) {
    return "Behavioral / HR prep:\n- Prepare 5 STAR stories (Situation, Task, Action, Result)\n- Common questions: teamwork, conflict, failure, leadership, pressure\n- Quantify results: 'led a team of 4', 'delivered 2 weeks early'\n- Always close the story with what you learned";
  }
  if (q.includes('technical interview') || q.includes('coding round')) {
    return "Technical interview strategy:\n1. Clarify problem before coding (ask about edge cases and constraints)\n2. Think aloud - state brute force first, then optimize\n3. Write clean code with meaningful variable names\n4. Test with examples + edge cases after coding\n5. Target: solve medium problems in under 20 minutes";
  }
  if (q.includes('interview') || q.includes('hr')) {
    return "Interview prep plan:\n- DSA Round: 2 medium LeetCode problems/day\n- Technical Round: System design basics + CS fundamentals (OS, DBMS, OOP, Networks)\n- HR Round: 5 STAR stories + company research\n- Mock interviews: 2 per week with a peer\n- Review past questions on Glassdoor / GeeksforGeeks";
  }

  // System design
  if (q.includes('system design') || q.includes('hld') || q.includes('lld') || q.includes('scalab')) {
    return "System design for placements:\n- HLD: Load balancing, Caching (Redis), CDN, Database sharding, Microservices, Message queues (Kafka)\n- LLD: Design patterns (Singleton, Factory, Observer), Class diagrams, SOLID principles\n- Practice: Design URL shortener, WhatsApp, Uber, Netflix\n- Resource: Grokking System Design, ByteByteGo";
  }

  // Projects
  if (q.includes('project') || q.includes('build') || q.includes('idea')) {
    return "Strong project ideas for placement:\n- Full-stack: Job tracker, Notes app with AI, E-commerce with payment gateway\n- DSA visualizer: Shows sorting / graph algorithms visually\n- ML: Resume screener, Spam classifier, Price predictor\n- DevOps: Deploy any app with CI/CD on AWS or GitHub Actions\n\nTip: Pick one, build it end-to-end, deploy it, add to GitHub with a README.";
  }

  // Placement / roadmap
  if (q.includes('placement') || q.includes('roadmap') || q.includes('study plan') || q.includes('strategy') || q.includes('prepare')) {
    return "6-month placement roadmap:\nMonth 1-2: DSA foundations (arrays, strings, hashing, trees)\nMonth 3: DSA advanced (graphs, DP) + 1 strong project completed\nMonth 4: CS fundamentals (OS, DBMS, OOP, Networks) + resume ready\nMonth 5: Mock interviews + system design basics\nMonth 6: Company-specific prep, apply, iterate\n\nDaily: 2 DSA problems + 30 min concept study + 1 job application";
  }

  // GitHub / LinkedIn / coding profiles
  if (q.includes('github')) {
    return "GitHub profile tips:\n- Pin your 4-6 best repos\n- Add README to every project (what it does, tech stack, how to run)\n- Contribute to 1-2 open source repos\n- Green contribution graph shows consistency\n- Add profile README.md with your skills and links";
  }
  if (q.includes('linkedin')) {
    return "LinkedIn tips:\n- Headline: 'CS Student | React | Node.js | DSA'\n- About: 3 lines on what you build and what you are looking for\n- Add all projects, internships, certifications\n- Connect with recruiters and alumni at target companies\n- Post once a week: solved X problems, built Y project";
  }
  if (q.includes('coding profile') || q.includes('profile')) {
    return "Build a strong online presence:\n- LeetCode: Target 200+ problems (50+ medium)\n- GitHub: 4-6 repos with READMEs and pinned projects\n- LinkedIn: Complete profile with 500+ connections\n- Codeforces/CodeChef: Participate in monthly contests\n- Put all links in resume header";
  }

  // CGPA
  if (q.includes('cgpa') || q.includes('gpa') || q.includes('grade')) {
    return "CGPA advice:\n- Most companies filter at 6.5-7.0 CGPA\n- Top companies may require 7.5+\n- If CGPA is low, compensate with strong projects, LeetCode, and internships\n- Some companies have no CGPA cutoff - focus on skills\n- For off-campus: CGPA matters less than your portfolio";
  }

  // Internship
  if (q.includes('internship') || q.includes('intern')) {
    return "Getting internships:\n- Apply from Month 3-4 of prep (do not wait until perfect)\n- Target: product startups first, then mid-size, then top firms\n- Platforms: Internshala, LinkedIn, AngelList, company career pages\n- Cold email HR or engineers at target companies with your portfolio\n- Any internship experience beats no experience on your resume";
  }

  // Thanks
  if (/^(thanks|thank you|ok|okay|got it|perfect|great|awesome|cool)\b/.test(q)) {
    return "You're welcome! Feel free to ask anything else about DSA, resume, interviews, or projects. I am here to help you crack placements!";
  }

  // Default
  return `I can help with placement preparation on topics like:\n- DSA & LeetCode strategy\n- Resume / ATS tips\n- Interview preparation (technical + HR)\n- System design (HLD/LLD)\n- Project ideas & guidance\n- Placement roadmap\n- Coding profile improvement\n\nTry: "How do I prepare for DSA?" or "Give me resume tips" or "What projects should I build?"`;
};

// --- Main handler ---------------------------------------------------------------
exports.chat = async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return next(new AppError('Message is required', 400, 'VALIDATION_ERROR'));
    }

    if (message.length > MAX_PROMPT_LENGTH) {
      return next(new AppError(`Message must be under ${MAX_PROMPT_LENGTH} characters`, 400, 'VALIDATION_ERROR'));
    }

    let reply = null;
    let mode = 'fallback';

    // Try Gemini first (free), then OpenAI, then local fallback
    try {
      reply = await fetchGeminiReply(message);
      if (reply) mode = 'gemini';
    } catch (e) {
      console.error('[Gemini] request failed:', e.message);
    }

    if (!reply) {
      try {
        reply = await fetchOpenAIReply(message);
        if (reply) mode = 'openai';
      } catch (e) {
        console.error('[OpenAI] request failed:', e.message);
      }
    }

    if (!reply) {
      reply = buildFallbackReply(message);
    }

    return res.status(200).json({
      success: true,
      data: { reply, mode }
    });
  } catch (error) {
    return next(error);
  }
};
