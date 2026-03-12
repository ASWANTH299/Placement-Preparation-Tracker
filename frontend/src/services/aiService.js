import api from './api'

// Full smart reply — works entirely on the frontend, no keys needed
const getSmartReply = (message = '') => {
  const q = message.trim().toLowerCase()
  if (!q) return "Please type a question and I'll help you!"

  // Greetings
  if (/^(hi|hello|hey|greetings|good (morning|evening|afternoon))\b/.test(q)) {
    return "Hello! I'm your placement prep assistant 👋\nAsk me anything about DSA, resume, interviews, system design, or project ideas!"
  }

  // What can you do
  if (q.includes('who are you') || q.includes('what can you do') || q.includes('what do you') || (q.includes('help') && q.length < 20)) {
    return "I'm your AI placement preparation assistant! I can help with:\n• DSA / LeetCode strategy\n• Resume and ATS tips\n• Interview preparation (technical + HR)\n• System design concepts\n• Project ideas & guidance\n• Coding profile improvement\n• Placement roadmap & study plans"
  }

  // ATS / Resume
  if (q.includes('ats') || q.includes('applicant tracking')) {
    return "ATS tips:\n• Use standard headings (Experience, Education, Skills)\n• Match keywords from the job description\n• Avoid tables, columns, images, or fancy fonts\n• Submit as .docx or simple PDF\n• Quantify everything: 'reduced load time by 40%'"
  }
  if (q.includes('resume') || q.includes('cv')) {
    if (q.includes('project')) {
      return "Resume projects section:\n• List 2–3 strong projects with tech stack\n• Format: Project Name | Tech used | GitHub link\n• One impact line each: 'Reduced API response time by 30%'\n• Prioritize full-stack, real-use-case, or DSA-heavy projects"
    }
    return "Resume essentials:\n• One page max\n• 2-line summary tailored per company\n• Projects with quantified results\n• Honest skills section\n• CGPA (if above 7.5)\n• GitHub, LinkedIn, LeetCode links in the header"
  }

  // DSA topics
  if (q.includes('graph') || q.includes('bfs') || q.includes('dfs')) {
    return "Graphs in DSA:\n• BFS → shortest path, level order traversal\n• DFS → connected components, cycle detection\n• Key patterns: Topological sort, Dijkstra, Union-Find\n• Must-solve: Number of Islands, Course Schedule, Word Ladder, Cheapest Flights Within K Stops"
  }
  if (q.includes('dynamic programming') || (q.includes('dp') && !q.includes('drop'))) {
    return "Dynamic Programming roadmap:\n1. Recursion → Memoization → Tabulation\n2. Patterns: 0/1 Knapsack, LCS, LIS, Matrix DP, Partition DP\n3. Must-solve: Climbing Stairs, Coin Change, Edit Distance, House Robber, LCS\nTip: Always define the state before writing code"
  }
  if (q.includes('tree') || q.includes('binary search tree') || q.includes('bst')) {
    return "Trees in DSA:\n• Master: Inorder/Preorder/Postorder traversals, BST operations, Height, LCA\n• Must-solve: Diameter of tree, Balance check, Zigzag traversal, Serialize/Deserialize\n• Resource: take U forward tree playlist, NeetCode"
  }
  if (q.includes('array') || (q.includes('string') && q.includes('dsa'))) {
    return "Arrays & Strings — start here:\n• Two pointer, Sliding window, Prefix sum\n• Must-solve: Two Sum, Maximum Subarray, 3Sum, Container With Most Water\n• Strings: Anagram check, Palindrome, KMP pattern matching\n• Target: master 5 patterns, 3 problems each"
  }
  if (q.includes('stack') || q.includes('queue') || q.includes('heap')) {
    return "Stack / Queue / Heap:\n• Stack: Next Greater Element, Valid Parentheses, Min Stack\n• Queue: BFS traversal, Sliding Window Maximum\n• Heap: Top K elements, Kth largest, Merge K sorted lists\n• Priority queue is your best friend for greedy + heap problems"
  }
  if (q.includes('backtracking') || q.includes('recursion')) {
    return "Recursion & Backtracking:\n• Template: choose → explore → unchoose\n• Must-solve: Subsets, Permutations, Combination Sum, N-Queens, Sudoku Solver\n• Tip: draw the recursion tree before coding\n• Time complexity = O(branching factor ^ depth)"
  }
  if (q.includes('binary search')) {
    return "Binary Search patterns:\n• Classic: sorted array search\n• On answer space: minimum/maximum feasible value\n• Must-solve: Search in Rotated Array, Find Peak Element, Median of Two Sorted Arrays, Koko Eating Bananas\n• Template: lo=0, hi=n-1, while lo<=hi, mid=lo+(hi-lo)/2"
  }
  if (q.includes('hashing') || q.includes('hash map') || q.includes('hashmap')) {
    return "Hashing essentials:\n• Use HashMap for O(1) lookup, frequency count, grouping\n• Must-solve: Two Sum, Group Anagrams, Longest Consecutive Sequence, Subarray Sum Equals K\n• Tip: when you need to check 'seen before' or 'count occurrences' → reach for a hash map"
  }
  if (q.includes('dsa') || q.includes('data structure') || q.includes('leetcode') || q.includes('algorithm')) {
    return "DSA study plan:\n1. Arrays & Strings (Two pointer, Sliding window)\n2. HashMap & Hashing\n3. Stack & Queue\n4. Recursion & Backtracking\n5. Trees (BT + BST)\n6. Graphs (BFS + DFS)\n7. Dynamic Programming\n\nPlatforms: LeetCode + NeetCode.io for pattern-based practice. Solve 2 problems daily minimum."
  }

  // Interview
  if (q.includes('tell me about') || q.includes('self intro') || q.includes('introduce yourself')) {
    return "Self-introduction formula (60 seconds):\n1. Name + degree + college\n2. Key skills (2–3 tech)\n3. Best project (one line with impact)\n4. Why this company/role\n\nExample: 'I'm [Name], final-year CS student from [College]. I work with React and Node.js and built a placement tracker used by 500+ students. I'm excited about this role because...'"
  }
  if (q.includes('behavioral') || q.includes('star method') || (q.includes('hr') && q.includes('question'))) {
    return "Behavioral / HR interview prep:\n• Prepare 5 STAR stories (Situation, Task, Action, Result)\n• Common: teamwork, conflict, failure, leadership, pressure\n• Quantify results: 'led a team of 4', 'delivered 2 weeks early'\n• Always end with what you learned from the experience"
  }
  if (q.includes('technical interview') || q.includes('coding round') || q.includes('online assessment')) {
    return "Technical interview strategy:\n1. Clarify problem (ask constraints + edge cases) before coding\n2. Think aloud — state brute force first, then optimize\n3. Write clean code with meaningful variable names\n4. Test with examples + edge cases after writing\n5. Target: solve medium LeetCode problems in under 20 min"
  }
  if (q.includes('interview') || q.includes('hr')) {
    return "Full interview prep plan:\n• DSA Round: 2 medium LeetCode problems/day\n• Technical Round: CS fundamentals (OS, DBMS, OOP, Networks) + system design\n• HR Round: 5 STAR stories + research the company deeply\n• Mock interviews: 2 per week with a peer\n• Review company-specific questions on Glassdoor / GeeksforGeeks"
  }

  // System design
  if (q.includes('system design') || q.includes('hld') || q.includes('lld') || q.includes('scalab')) {
    return "System design for placements:\n• HLD: Load balancing, Caching (Redis), CDN, DB sharding, Microservices, Message queues (Kafka)\n• LLD: Design patterns (Singleton, Factory, Observer), SOLID principles, Class diagrams\n• Practice designing: URL shortener, WhatsApp, Uber, Netflix\n• Resources: Grokking System Design, ByteByteGo"
  }

  // Projects
  if (q.includes('project') || q.includes('build') || q.includes('idea')) {
    return "Strong project ideas for placements:\n• Full-stack: Job tracker, Notes app with AI, E-commerce with payments\n• DSA Visualizer: animations for sorting/graph algorithms\n• ML: Resume screener, Spam classifier, Stock predictor\n• DevOps: Deploy any app with CI/CD on AWS or GitHub Actions\n\nTip: build end-to-end, deploy it, write a README, add to GitHub."
  }

  // Placement roadmap
  if (q.includes('placement') || q.includes('roadmap') || q.includes('study plan') || q.includes('strategy') || (q.includes('prepare') && q.includes('placement'))) {
    return "6-month placement roadmap:\nMonth 1–2: DSA foundations (arrays, strings, hashing, trees)\nMonth 3: DSA advanced (graphs, DP) + 1 strong project done\nMonth 4: CS fundamentals (OS, DBMS, OOP, Networks) + resume polished\nMonth 5: Mock interviews + system design basics\nMonth 6: Company-specific prep, apply, iterate\n\nDaily habit: 2 DSA problems + 30 min theory + 1 application"
  }

  // GitHub
  if (q.includes('github')) {
    return "GitHub profile tips:\n• Pin 4–6 best repos\n• Add README to every project (what it does, tech stack, setup)\n• Contribute to 1–2 open source projects\n• Keep the contribution graph active\n• Add a profile README.md with your skills and links"
  }

  // LinkedIn
  if (q.includes('linkedin')) {
    return "LinkedIn profile tips:\n• Headline: 'CS Student | React | Node.js | DSA'\n• About: 3 lines on what you build and what you're looking for\n• Add all projects, internships, certifications\n• Connect with recruiters and alumni at target companies\n• Post once a week: achievements, problems solved, projects shipped"
  }

  // Coding profiles
  if (q.includes('coding profile') || q.includes('leetcode profile') || q.includes('codeforces') || q.includes('competitive')) {
    return "Build a strong coding presence:\n• LeetCode: Target 200+ problems (50+ medium)\n• GitHub: 4–6 repos with READMEs + pinned\n• LinkedIn: Complete profile, 500+ connections\n• Codeforces/CodeChef: Participate in monthly contests\n• Put all profile links in your resume header"
  }

  // CGPA / grades
  if (q.includes('cgpa') || q.includes('gpa') || q.includes('grade') || q.includes('marks')) {
    return "CGPA for placements:\n• Most companies filter at 6.5–7.0\n• Top companies (Google, Microsoft) may need 7.5+\n• Low CGPA? Compensate with strong projects, LeetCode, internships\n• Some companies have no CGPA cutoff — focus purely on skills\n• Off-campus: CGPA matters much less than your portfolio"
  }

  // Internships
  if (q.includes('internship') || q.includes('intern')) {
    return "Getting internships:\n• Start applying from Month 3–4 (don't wait to be 'ready')\n• Target: product startups first → mid-size → top firms\n• Platforms: Internshala, LinkedIn, AngelList, company career pages\n• Cold email engineers at target companies with your project links\n• Any real internship beats no experience on your resume"
  }

  // CS fundamentals
  if (q.includes('operating system') || q.includes('os concept') || (q.includes('os') && q.length < 15)) {
    return "OS concepts for interviews:\n• Process vs Thread, Scheduling algorithms (FCFS, SJF, Round Robin)\n• Memory management: Paging, Segmentation, Virtual memory\n• Deadlock: conditions, prevention, detection\n• Synchronization: mutex, semaphore, monitors\n• Must-read: Galvin's OS book or GeeksforGeeks OS section"
  }
  if (q.includes('dbms') || q.includes('database') || q.includes('sql')) {
    return "DBMS / SQL for placements:\n• Relational model, Keys (Primary, Foreign, Candidate)\n• Normalization: 1NF, 2NF, 3NF, BCNF\n• SQL: JOINs (inner, left, right, full), GROUP BY, HAVING, subqueries, window functions\n• Transactions: ACID properties, isolation levels\n• Indexing, query optimization basics"
  }
  if (q.includes('oops') || q.includes('oop') || q.includes('object oriented')) {
    return "OOP concepts for interviews:\n• 4 pillars: Encapsulation, Inheritance, Polymorphism, Abstraction\n• Overloading vs Overriding\n• Abstract class vs Interface\n• Design patterns: Singleton, Factory, Observer, Strategy\n• Common question: 'Real-world example of each OOP concept'"
  }
  if (q.includes('network') || q.includes('tcp') || q.includes('http') || q.includes('dns')) {
    return "Computer Networks for placements:\n• OSI model: 7 layers and their roles\n• TCP vs UDP, HTTP vs HTTPS\n• DNS resolution, IP addressing (IPv4/IPv6), subnetting\n• How browsers work: DNS → TCP handshake → HTTP request → rendering\n• Common interview: 'What happens when you type google.com?'"
  }

  // Time complexity / Big O
  if (q.includes('time complexity') || q.includes('big o') || q.includes('space complexity')) {
    return "Complexity analysis tips:\n• Know common complexities: O(1), O(log n), O(n), O(n log n), O(n²)\n• Sorting: merge sort O(n log n), quick sort O(n log n) avg\n• BFS/DFS: O(V+E) for graphs\n• Space: consider recursion stack (O(depth)) and auxiliary arrays\n• Interviewers expect you to state complexity BEFORE they ask"
  }

  // Thanks / done
  if (/^(thanks|thank you|ok|okay|got it|perfect|great|awesome|cool|nice)\b/.test(q)) {
    return "You're welcome! 😊 Feel free to ask anything else about DSA, resume, interviews, or placements. I'm here to help!"
  }

  // Default — always useful
  return `I can help you with placement preparation! Here are some things to ask:\n\n• "Give me a DSA roadmap"\n• "How to write a good resume?"\n• "How to prepare for technical interviews?"\n• "What projects should I build?"\n• "Explain dynamic programming"\n• "Tips for system design interviews"\n• "How to improve my GitHub profile?"\n\nJust ask away!`
}

export const askAiAssistant = async (message) => {
  try {
    const response = await api.post('/students/ai/chat', { message })
    return response?.data?.data || {}
  } catch {
    // Backend not available — use full smart frontend reply
    return { reply: getSmartReply(message), mode: 'frontend' }
  }
}

