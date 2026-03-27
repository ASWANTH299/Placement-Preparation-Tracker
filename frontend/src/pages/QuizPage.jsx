import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import './QuizPage.css'

const HISTORY_KEY = 'quiz-history-v1'
const BEST_SCORE_KEY = 'quiz-best-score-v1'
const QUIZ_BANK_KEY = 'quiz-question-bank-v1'
const TIME_PER_QUESTION = 45

const defaultQuestionBank = [
  {
    id: 'alg-1',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'What is the time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    answer: 1,
    explanation: 'Binary search halves the search space at each step, giving O(log n).',
  },
  {
    id: 'alg-2',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'Which algorithmic technique is typically used in merge sort?',
    options: ['Greedy', 'Dynamic Programming', 'Divide and Conquer', 'Backtracking'],
    answer: 2,
    explanation: 'Merge sort recursively divides the array and then merges sorted halves.',
  },
  {
    id: 'alg-3',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'For Dijkstra algorithm to work correctly, edge weights must be:',
    options: ['Positive or zero', 'Any integer', 'Only negative', 'Only zero'],
    answer: 0,
    explanation: 'Dijkstra assumes non-negative edge weights to guarantee optimality.',
  },
  {
    id: 'ds-1',
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'Which data structure is used for BFS traversal?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Set'],
    answer: 1,
    explanation: 'BFS processes nodes level-by-level using a queue.',
  },
  {
    id: 'ds-2',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'Average-case search time complexity in a balanced BST is:',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    answer: 1,
    explanation: 'Balanced BST height is O(log n), so search is O(log n).',
  },
  {
    id: 'ds-3',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'Which operation is NOT O(1) in an array-backed stack?',
    options: ['push', 'pop', 'peek', 'search for an arbitrary value'],
    answer: 3,
    explanation: 'Searching an arbitrary value in a stack is linear in size.',
  },
  {
    id: 'db-1',
    category: 'Databases',
    difficulty: 'Easy',
    question: 'Which SQL clause is used to filter groups after aggregation?',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
    answer: 1,
    explanation: 'HAVING filters grouped rows after GROUP BY and aggregate calculations.',
  },
  {
    id: 'db-2',
    category: 'Databases',
    difficulty: 'Medium',
    question: 'A primary key must be:',
    options: ['Nullable and unique', 'Non-null and unique', 'Only indexed', 'Text type'],
    answer: 1,
    explanation: 'Primary keys uniquely identify rows and cannot be null.',
  },
  {
    id: 'db-3',
    category: 'Databases',
    difficulty: 'Hard',
    question: 'What does ACID property "I" stand for?',
    options: ['Indexing', 'Isolation', 'Integrity', 'Iteration'],
    answer: 1,
    explanation: 'Isolation ensures concurrent transactions do not interfere incorrectly.',
  },
  {
    id: 'os-1',
    category: 'Operating Systems',
    difficulty: 'Easy',
    question: 'Which of the following is NOT a process state?',
    options: ['Ready', 'Running', 'Waiting', 'Compiled'],
    answer: 3,
    explanation: 'Compiled is a build status, not an OS scheduler state.',
  },
  {
    id: 'os-2',
    category: 'Operating Systems',
    difficulty: 'Medium',
    question: 'Deadlock requires how many Coffman conditions?',
    options: ['2', '3', '4', '5'],
    answer: 2,
    explanation: 'All four Coffman conditions are necessary for deadlock.',
  },
  {
    id: 'os-3',
    category: 'Operating Systems',
    difficulty: 'Hard',
    question: 'Which scheduling algorithm can cause starvation of long jobs?',
    options: ['FCFS', 'SJF', 'Round Robin', 'FIFO'],
    answer: 1,
    explanation: 'Shortest Job First can starve longer jobs if short jobs keep arriving.',
  },
  {
    id: 'cn-1',
    category: 'Computer Networks',
    difficulty: 'Easy',
    question: 'Which protocol is used for secure web communication?',
    options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'],
    answer: 2,
    explanation: 'HTTPS is HTTP over TLS for secure communication.',
  },
  {
    id: 'cn-2',
    category: 'Computer Networks',
    difficulty: 'Medium',
    question: 'Which layer in OSI model handles routing?',
    options: ['Transport', 'Network', 'Session', 'Application'],
    answer: 1,
    explanation: 'Routing decisions are made at the Network layer.',
  },
  {
    id: 'cn-3',
    category: 'Computer Networks',
    difficulty: 'Hard',
    question: 'TCP provides reliability using:',
    options: ['Only checksums', 'ACKs and retransmissions', 'Only encryption', 'Only compression'],
    answer: 1,
    explanation: 'TCP uses sequence numbers, ACKs, timeouts, and retransmissions.',
  },
  {
    id: 'apt-1',
    category: 'Aptitude',
    difficulty: 'Easy',
    question: 'If a train travels 60 km in 1 hour, its speed is:',
    options: ['30 km/h', '45 km/h', '60 km/h', '90 km/h'],
    answer: 2,
    explanation: 'Speed = distance / time = 60 / 1 = 60 km/h.',
  },
  {
    id: 'apt-2',
    category: 'Aptitude',
    difficulty: 'Medium',
    question: 'What is 15% of 240?',
    options: ['24', '30', '36', '40'],
    answer: 2,
    explanation: '10% of 240 is 24 and 5% is 12, so 15% is 36.',
  },
  {
    id: 'apt-3',
    category: 'Aptitude',
    difficulty: 'Hard',
    question: 'A man completes work in 12 days. His one-day work is:',
    options: ['1/6', '1/12', '12', '1/24'],
    answer: 1,
    explanation: 'Rate of work is reciprocal of time = 1/12 per day.',
  },
  {
    id: 'hr-1',
    category: 'Interview Prep',
    difficulty: 'Easy',
    question: 'Best structure for "Tell me about yourself" is:',
    options: ['Random details', 'Past-Present-Future', 'Only hobbies', 'Only marks'],
    answer: 1,
    explanation: 'Past-Present-Future provides a concise and logical narrative.',
  },
  {
    id: 'hr-2',
    category: 'Interview Prep',
    difficulty: 'Medium',
    question: 'For behavioral answers, which framework is recommended?',
    options: ['SEO', 'STAR', 'SWOT', 'FIFO'],
    answer: 1,
    explanation: 'STAR: Situation, Task, Action, Result.',
  },
  {
    id: 'hr-3',
    category: 'Interview Prep',
    difficulty: 'Hard',
    question: 'When discussing weaknesses in interviews, the best approach is:',
    options: ['Deny having weaknesses', 'Give unrelated weakness', 'Share real one + improvement plan', 'Blame team'],
    answer: 2,
    explanation: 'A genuine weakness with concrete improvement demonstrates self-awareness.',
  },
  {
    id: 'alg-4',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'Which sorting algorithm has average-case time complexity O(n log n)?',
    options: ['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort'],
    answer: 1,
    explanation: 'Merge sort runs in O(n log n) consistently across cases.',
  },
  {
    id: 'alg-5',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'Which technique is used in the 0/1 Knapsack problem?',
    options: ['Greedy only', 'Divide and Conquer only', 'Dynamic Programming', 'Binary Search'],
    answer: 2,
    explanation: '0/1 Knapsack is classically solved with dynamic programming.',
  },
  {
    id: 'alg-6',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'Floyd-Warshall algorithm is used to solve:',
    options: ['Single source shortest path', 'All-pairs shortest path', 'Minimum spanning tree', 'Topological sort'],
    answer: 1,
    explanation: 'Floyd-Warshall computes shortest paths between all pairs of vertices.',
  },
  {
    id: 'ds-4',
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'Which data structure follows LIFO order?',
    options: ['Queue', 'Stack', 'Heap', 'Graph'],
    answer: 1,
    explanation: 'Stack is Last-In-First-Out.',
  },
  {
    id: 'ds-5',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'In a min-heap, the smallest element is always at:',
    options: ['Leaf node', 'Root node', 'Middle level', 'Any node'],
    answer: 1,
    explanation: 'Heap property guarantees the minimum at the root in a min-heap.',
  },
  {
    id: 'ds-6',
    category: 'Data Structures',
    difficulty: 'Hard',
    question: 'Which traversal of BST gives sorted output?',
    options: ['Preorder', 'Postorder', 'Inorder', 'Level order'],
    answer: 2,
    explanation: 'Inorder traversal of BST visits values in sorted order.',
  },
  {
    id: 'db-4',
    category: 'Databases',
    difficulty: 'Easy',
    question: 'Which SQL command is used to fetch data?',
    options: ['INSERT', 'SELECT', 'UPDATE', 'DELETE'],
    answer: 1,
    explanation: 'SELECT retrieves rows from one or more tables.',
  },
  {
    id: 'db-5',
    category: 'Databases',
    difficulty: 'Medium',
    question: 'Which normal form removes partial dependency?',
    options: ['1NF', '2NF', '3NF', 'BCNF'],
    answer: 1,
    explanation: '2NF removes partial dependency on a composite primary key.',
  },
  {
    id: 'db-6',
    category: 'Databases',
    difficulty: 'Hard',
    question: 'Which JOIN returns all rows from left table and matching rows from right?',
    options: ['INNER JOIN', 'RIGHT JOIN', 'FULL JOIN', 'LEFT JOIN'],
    answer: 3,
    explanation: 'LEFT JOIN keeps all left rows with matching right rows when available.',
  },
  {
    id: 'os-4',
    category: 'Operating Systems',
    difficulty: 'Easy',
    question: 'Which of these is an example of an operating system?',
    options: ['MySQL', 'Linux', 'React', 'Node.js'],
    answer: 1,
    explanation: 'Linux is an operating system kernel and ecosystem.',
  },
  {
    id: 'os-5',
    category: 'Operating Systems',
    difficulty: 'Medium',
    question: 'Round Robin scheduling mainly uses:',
    options: ['Priority only', 'Time quantum', 'Shortest burst first', 'No preemption'],
    answer: 1,
    explanation: 'Round Robin allocates CPU in fixed time slices (quantum).',
  },
  {
    id: 'os-6',
    category: 'Operating Systems',
    difficulty: 'Hard',
    question: 'Thrashing in OS is primarily caused by:',
    options: ['Too many CPU cores', 'Excessive paging', 'Compiler errors', 'Network congestion'],
    answer: 1,
    explanation: 'Thrashing happens when system spends most time swapping pages.',
  },
  {
    id: 'cn-4',
    category: 'Computer Networks',
    difficulty: 'Easy',
    question: 'What is the default port of HTTPS?',
    options: ['21', '25', '80', '443'],
    answer: 3,
    explanation: 'HTTPS typically runs on TCP port 443.',
  },
  {
    id: 'cn-5',
    category: 'Computer Networks',
    difficulty: 'Medium',
    question: 'Which device forwards packets between different networks?',
    options: ['Switch', 'Hub', 'Router', 'Repeater'],
    answer: 2,
    explanation: 'Routers perform layer-3 forwarding between networks.',
  },
  {
    id: 'cn-6',
    category: 'Computer Networks',
    difficulty: 'Hard',
    question: 'Which congestion control phase exponentially increases cwnd in TCP?',
    options: ['Congestion avoidance', 'Slow start', 'Fast recovery', 'Flow control'],
    answer: 1,
    explanation: 'In slow start, congestion window grows exponentially each RTT.',
  },
  {
    id: 'apt-4',
    category: 'Aptitude',
    difficulty: 'Easy',
    question: 'If CP = 100 and SP = 120, profit percentage is:',
    options: ['10%', '15%', '20%', '25%'],
    answer: 2,
    explanation: 'Profit = 20, so profit % = (20/100)*100 = 20%.',
  },
  {
    id: 'apt-5',
    category: 'Aptitude',
    difficulty: 'Medium',
    question: 'A number increased by 20% becomes 72. The original number is:',
    options: ['50', '55', '60', '65'],
    answer: 2,
    explanation: 'Original x 1.2 = 72, so x = 60.',
  },
  {
    id: 'apt-6',
    category: 'Aptitude',
    difficulty: 'Hard',
    question: 'Pipe A fills in 6h and Pipe B fills in 3h. Together they fill in:',
    options: ['1h', '1.5h', '2h', '2.5h'],
    answer: 2,
    explanation: 'Combined rate = 1/6 + 1/3 = 1/2, so time = 2 hours.',
  },
  {
    id: 'hr-4',
    category: 'Interview Prep',
    difficulty: 'Easy',
    question: 'A good interview introduction should be:',
    options: ['Very long', 'Concise and relevant', 'Only personal', 'Only technical jargon'],
    answer: 1,
    explanation: 'Keep intro concise, role-relevant, and easy to follow.',
  },
  {
    id: 'hr-5',
    category: 'Interview Prep',
    difficulty: 'Medium',
    question: 'For project explanation in interviews, best order is:',
    options: ['Tools only', 'Outcome only', 'Problem -> Approach -> Impact', 'Code first'],
    answer: 2,
    explanation: 'Explain context, solution approach, and measurable impact.',
  },
  {
    id: 'hr-6',
    category: 'Interview Prep',
    difficulty: 'Hard',
    question: 'Best way to answer an unknown technical question is:',
    options: ['Guess confidently', 'Stay silent', 'Admit gap and reason out approach', 'Change topic'],
    answer: 2,
    explanation: 'Honesty plus structured thinking is preferred over random guessing.',
  },
  {
    id: 'alg-7',
    category: 'Algorithms',
    difficulty: 'Easy',
    question: 'Which search algorithm works best on sorted arrays?',
    options: ['Linear Search', 'Binary Search', 'DFS', 'BFS'],
    answer: 1,
    explanation: 'Binary search efficiently narrows down on sorted arrays.',
  },
  {
    id: 'alg-8',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: 'Kadane algorithm is used for:',
    options: ['Maximum subarray sum', 'Shortest path', 'MST', 'String matching'],
    answer: 0,
    explanation: 'Kadane finds the maximum sum contiguous subarray in O(n).',
  },
  {
    id: 'alg-9',
    category: 'Algorithms',
    difficulty: 'Hard',
    question: 'Which algorithm solves minimum spanning tree?',
    options: ['Kruskal', 'Dijkstra', 'Bellman-Ford', 'Floyd-Warshall'],
    answer: 0,
    explanation: 'Kruskal and Prim are classic MST algorithms.',
  },
  {
    id: 'ds-7',
    category: 'Data Structures',
    difficulty: 'Easy',
    question: 'Which structure is best for FIFO processing?',
    options: ['Stack', 'Queue', 'Deque', 'Tree'],
    answer: 1,
    explanation: 'Queue follows first-in, first-out order.',
  },
  {
    id: 'ds-8',
    category: 'Data Structures',
    difficulty: 'Medium',
    question: 'Hash table average lookup time is:',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    answer: 2,
    explanation: 'With good hashing, average lookup is constant time.',
  },
  {
    id: 'ds-9',
    category: 'Data Structures',
    difficulty: 'Hard',
    question: 'AVL tree guarantees height of:',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    answer: 1,
    explanation: 'AVL balancing maintains logarithmic height.',
  },
  {
    id: 'db-7',
    category: 'Databases',
    difficulty: 'Easy',
    question: 'Which SQL clause sorts query results?',
    options: ['GROUP BY', 'ORDER BY', 'HAVING', 'JOIN'],
    answer: 1,
    explanation: 'ORDER BY sorts rows based on columns.',
  },
  {
    id: 'db-8',
    category: 'Databases',
    difficulty: 'Medium',
    question: 'A foreign key is used to:',
    options: ['Encrypt data', 'Link two tables', 'Create indexes', 'Sort rows'],
    answer: 1,
    explanation: 'Foreign keys enforce referential links across tables.',
  },
  {
    id: 'db-9',
    category: 'Databases',
    difficulty: 'Hard',
    question: 'Which isolation level prevents dirty reads?',
    options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
    answer: 1,
    explanation: 'Read Committed and above prevent dirty reads.',
  },
  {
    id: 'os-7',
    category: 'Operating Systems',
    difficulty: 'Easy',
    question: 'Which memory is volatile?',
    options: ['ROM', 'RAM', 'SSD', 'HDD'],
    answer: 1,
    explanation: 'RAM loses data when power is off.',
  },
  {
    id: 'os-8',
    category: 'Operating Systems',
    difficulty: 'Medium',
    question: 'Context switch occurs when:',
    options: ['Power off', 'CPU changes process/thread', 'Compilation starts', 'Disk is formatted'],
    answer: 1,
    explanation: 'Scheduler switches CPU state between executing tasks.',
  },
  {
    id: 'os-9',
    category: 'Operating Systems',
    difficulty: 'Hard',
    question: 'Which algorithm is used for page replacement?',
    options: ['LRU', 'DFS', 'BFS', 'KMP'],
    answer: 0,
    explanation: 'LRU is a common page replacement strategy.',
  },
  {
    id: 'cn-7',
    category: 'Computer Networks',
    difficulty: 'Easy',
    question: 'IP stands for:',
    options: ['Internet Protocol', 'Internal Process', 'Interface Port', 'Input Program'],
    answer: 0,
    explanation: 'IP is Internet Protocol.',
  },
  {
    id: 'cn-8',
    category: 'Computer Networks',
    difficulty: 'Medium',
    question: 'Which protocol resolves domain names to IP addresses?',
    options: ['DHCP', 'DNS', 'ARP', 'ICMP'],
    answer: 1,
    explanation: 'DNS maps human-readable domains to IP addresses.',
  },
  {
    id: 'cn-9',
    category: 'Computer Networks',
    difficulty: 'Hard',
    question: 'Three-way handshake is used by:',
    options: ['UDP', 'TCP', 'HTTP', 'FTP'],
    answer: 1,
    explanation: 'TCP establishes connection with SYN, SYN-ACK, ACK.',
  },
  {
    id: 'apt-7',
    category: 'Aptitude',
    difficulty: 'Easy',
    question: 'What is 25% of 200?',
    options: ['25', '40', '50', '75'],
    answer: 2,
    explanation: '25% of 200 equals 50.',
  },
  {
    id: 'apt-8',
    category: 'Aptitude',
    difficulty: 'Medium',
    question: 'Simple interest on 1000 at 10% for 2 years is:',
    options: ['100', '150', '200', '250'],
    answer: 2,
    explanation: 'SI = PRT/100 = 1000*10*2/100 = 200.',
  },
  {
    id: 'apt-9',
    category: 'Aptitude',
    difficulty: 'Hard',
    question: 'If 3 men do work in 12 days, 6 men do it in:',
    options: ['3 days', '6 days', '9 days', '12 days'],
    answer: 1,
    explanation: 'Doubling workers halves time: 12 to 6 days.',
  },
  {
    id: 'hr-7',
    category: 'Interview Prep',
    difficulty: 'Easy',
    question: 'Best resume length for freshers is typically:',
    options: ['1 page', '3 pages', '5 pages', 'No limit'],
    answer: 0,
    explanation: 'A concise one-page resume is generally preferred for freshers.',
  },
  {
    id: 'hr-8',
    category: 'Interview Prep',
    difficulty: 'Medium',
    question: 'When asked "Why this company?" you should focus on:',
    options: ['Salary only', 'Random facts', 'Role fit and company mission', 'Friends working there'],
    answer: 2,
    explanation: 'Show research and alignment between your goals and company direction.',
  },
  {
    id: 'hr-9',
    category: 'Interview Prep',
    difficulty: 'Hard',
    question: 'For a conflict question, strong answer includes:',
    options: ['Blaming teammate', 'Avoiding details', 'Context, actions, resolution, learning', 'Saying no conflicts ever'],
    answer: 2,
    explanation: 'Interviewers expect ownership, communication, and outcomes.',
  },
]

const shuffle = (items) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const getStoredHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

const getStoredBestScore = () => Number(localStorage.getItem(BEST_SCORE_KEY) || 0)

const getStoredQuestionBank = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUIZ_BANK_KEY) || '[]')
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultQuestionBank
    return parsed
  } catch {
    return defaultQuestionBank
  }
}

const buildAnalytics = (questions, answers, maxStreak) => {
  const categoryStats = {}
  const difficultyStats = {}
  let correct = 0
  let attempted = 0
  let timedOut = 0
  let totalTime = 0

  questions.forEach((question) => {
    const answer = answers[question.id]
    const attemptedQuestion = answer?.selectedIndex !== null
    const isCorrect = Boolean(answer?.isCorrect)
    const wasTimedOut = Boolean(answer?.timedOut)

    if (attemptedQuestion) attempted += 1
    if (isCorrect) correct += 1
    if (wasTimedOut) timedOut += 1
    totalTime += answer?.timeSpent ?? TIME_PER_QUESTION

    if (!categoryStats[question.category]) {
      categoryStats[question.category] = { total: 0, correct: 0 }
    }
    categoryStats[question.category].total += 1
    if (isCorrect) categoryStats[question.category].correct += 1

    if (!difficultyStats[question.difficulty]) {
      difficultyStats[question.difficulty] = { total: 0, correct: 0 }
    }
    difficultyStats[question.difficulty].total += 1
    if (isCorrect) difficultyStats[question.difficulty].correct += 1
  })

  const total = questions.length
  const skipped = total - attempted
  const wrong = attempted - correct
  const scorePercent = Math.round((correct / total) * 100)
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0
  const avgTime = Math.round(totalTime / total)

  return {
    total,
    correct,
    wrong,
    skipped,
    attempted,
    timedOut,
    scorePercent,
    accuracy,
    avgTime,
    maxStreak,
    categoryStats,
    difficultyStats,
  }
}

export default function QuizPage() {
  const role = useSelector((state) => state.auth.role)
  const isAdmin = role === 'admin'
  const [quizBank, setQuizBank] = useState(getStoredQuestionBank)
  const [phase, setPhase] = useState('setup')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [questionStartAt, setQuestionStartAt] = useState(Date.now())
  const [answers, setAnswers] = useState({})
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [history, setHistory] = useState(getStoredHistory)
  const [bestScore, setBestScore] = useState(getStoredBestScore)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [editorError, setEditorError] = useState('')
  const [editorForm, setEditorForm] = useState({
    category: 'Algorithms',
    difficulty: 'Easy',
    question: '',
    optionsText: '',
    answerIndex: 0,
    explanation: '',
  })

  useEffect(() => {
    localStorage.setItem(QUIZ_BANK_KEY, JSON.stringify(quizBank))
  }, [quizBank])

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(quizBank.map((q) => q.category)))],
    [quizBank],
  )

  const difficulties = useMemo(
    () => ['All', ...Array.from(new Set(quizBank.map((q) => q.difficulty)))],
    [quizBank],
  )

  const filteredPool = useMemo(
    () =>
      quizBank.filter(
        (q) =>
          (selectedCategory === 'All' || q.category === selectedCategory) &&
          (selectedDifficulty === 'All' || q.difficulty === selectedDifficulty),
      ),
    [selectedCategory, selectedDifficulty, quizBank],
  )
  const maxQuestionCount = Math.min(30, quizBank.length)

  useEffect(() => {
    setQuestionCount(Math.min(10, maxQuestionCount))
  }, [selectedCategory, selectedDifficulty, maxQuestionCount])

  const decreaseQuestionCount = () => {
    setQuestionCount((currentValue) => Math.max(1, currentValue - 1))
  }

  const increaseQuestionCount = () => {
    setQuestionCount((currentValue) => Math.min(maxQuestionCount, currentValue + 1))
  }

  const currentQuestion = questions[currentIndex]

  const finalizeAttempt = useCallback(
    (nextAnswers, finalMaxStreak) => {
      const analytics = buildAnalytics(questions, nextAnswers, finalMaxStreak)
      const nextHistory = [
        {
          id: `${Date.now()}`,
          timestamp: new Date().toISOString(),
          score: analytics.correct,
          total: analytics.total,
          scorePercent: analytics.scorePercent,
          accuracy: analytics.accuracy,
          avgTime: analytics.avgTime,
          category: selectedCategory,
          difficulty: selectedDifficulty,
        },
        ...history,
      ].slice(0, 8)

      setHistory(nextHistory)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))

      if (analytics.scorePercent > bestScore) {
        setBestScore(analytics.scorePercent)
        localStorage.setItem(BEST_SCORE_KEY, String(analytics.scorePercent))
      }

      setPhase('result')
    },
    [questions, selectedCategory, selectedDifficulty, history, bestScore],
  )

  const moveToNext = useCallback(
    (nextAnswers, finalMaxStreak) => {
      const isLastQuestion = currentIndex >= questions.length - 1
      if (isLastQuestion) {
        finalizeAttempt(nextAnswers, finalMaxStreak)
        return
      }
      setCurrentIndex((value) => value + 1)
      setSelectedOption(null)
      setTimeLeft(TIME_PER_QUESTION)
      setQuestionStartAt(Date.now())
    },
    [currentIndex, questions.length, finalizeAttempt],
  )

  const submitAnswer = useCallback(
    (optionIndex = selectedOption, timedOut = false) => {
      if (phase !== 'quiz' || !currentQuestion) return
      if (answers[currentQuestion.id]) return

      const picked = typeof optionIndex === 'number' ? optionIndex : null
      const isCorrect = picked === currentQuestion.answer
      const timeSpent = Math.min(
        TIME_PER_QUESTION,
        Math.max(1, Math.round((Date.now() - questionStartAt) / 1000)),
      )

      const nextStreak = isCorrect ? streak + 1 : 0
      const nextMaxStreak = Math.max(maxStreak, nextStreak)

      const nextAnswers = {
        ...answers,
        [currentQuestion.id]: {
          selectedIndex: picked,
          isCorrect,
          timedOut,
          timeSpent,
        },
      }

      setAnswers(nextAnswers)
      setStreak(nextStreak)
      setMaxStreak(nextMaxStreak)
      moveToNext(nextAnswers, nextMaxStreak)
    },
    [
      selectedOption,
      phase,
      currentQuestion,
      answers,
      questionStartAt,
      streak,
      maxStreak,
      moveToNext,
    ],
  )

  useEffect(() => {
    if (phase !== 'quiz') return undefined
    if (timeLeft <= 0) {
      submitAnswer(null, true)
      return undefined
    }

    const timeout = setTimeout(() => {
      setTimeLeft((value) => value - 1)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [phase, timeLeft, submitAnswer])

  const analytics = useMemo(
    () => (phase === 'result' ? buildAnalytics(questions, answers, maxStreak) : null),
    [phase, questions, answers, maxStreak],
  )

  const recentHistory = history.slice(0, 5)
  const progress = questions.length ? Math.round((currentIndex / questions.length) * 100) : 0

  const startQuiz = () => {
    if (filteredPool.length === 0) return
    const totalQuestions = Math.min(questionCount, maxQuestionCount)

    const seen = new Set()
    const mergedPool = []

    const pushUnique = (items) => {
      items.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          mergedPool.push(item)
        }
      })
    }

    pushUnique(shuffle(filteredPool))

    if (selectedCategory !== 'All') {
      pushUnique(
        shuffle(
          quizBank.filter((question) => question.category === selectedCategory),
        ),
      )
    }

    if (selectedDifficulty !== 'All') {
      pushUnique(
        shuffle(
          quizBank.filter((question) => question.difficulty === selectedDifficulty),
        ),
      )
    }

    pushUnique(shuffle(quizBank))

    const selectedQuestions = mergedPool.slice(0, totalQuestions)

    setQuestions(selectedQuestions)
    setCurrentIndex(0)
    setSelectedOption(null)
    setTimeLeft(TIME_PER_QUESTION)
    setQuestionStartAt(Date.now())
    setAnswers({})
    setStreak(0)
    setMaxStreak(0)
    setPhase('quiz')
  }

  const resetToSetup = () => {
    setPhase('setup')
    setQuestions([])
    setCurrentIndex(0)
    setSelectedOption(null)
    setTimeLeft(TIME_PER_QUESTION)
    setAnswers({})
    setStreak(0)
    setMaxStreak(0)
  }

  const openCreateEditor = () => {
    setEditorOpen(true)
    setEditingId('')
    setEditorError('')
    setEditorForm({
      category: categories[1] || 'Algorithms',
      difficulty: difficulties[1] || 'Easy',
      question: '',
      optionsText: '',
      answerIndex: 0,
      explanation: '',
    })
  }

  const openEditEditor = (question) => {
    if (!question) return
    setEditorOpen(true)
    setEditingId(question.id)
    setEditorError('')
    setEditorForm({
      category: question.category,
      difficulty: question.difficulty,
      question: question.question,
      optionsText: (question.options || []).join('\n'),
      answerIndex: Number(question.answer || 0),
      explanation: question.explanation || '',
    })
  }

  const deleteQuestion = (questionId) => {
    if (!questionId) return
    const target = quizBank.find((item) => item.id === questionId)
    const confirmed = window.confirm(`Delete quiz question: "${target?.question || 'selected question'}"?`)
    if (!confirmed) return

    setQuizBank((prev) => prev.filter((item) => item.id !== questionId))
  }

  const saveQuestion = () => {
    const options = editorForm.optionsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!editorForm.question.trim()) {
      setEditorError('Question text is required.')
      return
    }
    if (options.length < 2) {
      setEditorError('At least two options are required (one per line).')
      return
    }
    if (editorForm.answerIndex < 0 || editorForm.answerIndex >= options.length) {
      setEditorError('Correct option index is out of range.')
      return
    }

    const payload = {
      id: editingId || `quiz-${Date.now()}`,
      category: editorForm.category,
      difficulty: editorForm.difficulty,
      question: editorForm.question.trim(),
      options,
      answer: Number(editorForm.answerIndex),
      explanation: editorForm.explanation.trim() || 'No explanation provided.',
    }

    setQuizBank((prev) => {
      if (!editingId) return [payload, ...prev]
      return prev.map((item) => (item.id === editingId ? payload : item))
    })

    setEditorOpen(false)
    setEditingId('')
    setEditorError('')
  }

  return (
    <section className="quiz-page">
      <div className="qp-shell">
        <header className="qp-header">
          <p className="qp-kicker">Practice Arena</p>
          <h1>QUIZ</h1>
          <p className="qp-subtitle">
            Sharpen DSA, core CS, aptitude, and interview readiness with measurable performance insights.
          </p>
        </header>

        {phase === 'setup' && (
          <div className="qp-setup">
            <div className="qp-setup-grid">
              <label>
                Category
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                Difficulty
                <select value={selectedDifficulty} onChange={(event) => setSelectedDifficulty(event.target.value)}>
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </label>

              <label>
                Questions
                <div className="qp-question-stepper" role="group" aria-label="Question count selector">
                  <button
                    type="button"
                    className="qp-step-btn"
                    onClick={decreaseQuestionCount}
                    disabled={questionCount <= 1}
                    aria-label="Decrease question count"
                  >
                    -
                  </button>
                  <input type="text" value={questionCount} readOnly aria-label="Selected question count" />
                  <button
                    type="button"
                    className="qp-step-btn"
                    onClick={increaseQuestionCount}
                    disabled={questionCount >= maxQuestionCount}
                    aria-label="Increase question count"
                  >
                    +
                  </button>
                </div>
                <span className="qp-limit-note">Available for current filter: {maxQuestionCount}</span>
              </label>
            </div>

            <div className="qp-meta-row">
              <span>Pool Size: {filteredPool.length}</span>
              <span>Time per Question: {TIME_PER_QUESTION}s</span>
              <span>Best Score: {bestScore}%</span>
              <span>Maximum selectable: {maxQuestionCount}</span>
            </div>

            <button
              type="button"
              className="qp-primary-btn"
              onClick={startQuiz}
              disabled={filteredPool.length < 1}
            >
              Start Quiz
            </button>

            {filteredPool.length < 1 && (
              <p className="qp-warning">No questions found for this filter. Pick a broader category or difficulty.</p>
            )}

            {recentHistory.length > 0 && (
              <div className="qp-history">
                <h3>Recent Attempts</h3>
                <ul>
                  {recentHistory.map((attempt) => (
                    <li key={attempt.id}>
                      <span>{new Date(attempt.timestamp).toLocaleString()}</span>
                      <span>{attempt.score}/{attempt.total}</span>
                      <span>{attempt.scorePercent}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isAdmin && (
              <div className="qp-admin-panel">
                <div className="qp-admin-panel-head">
                  <h3>Admin Quiz Question Management</h3>
                  <button type="button" className="qp-primary-btn" onClick={openCreateEditor}>Add Question</button>
                </div>

                {editorOpen && (
                  <div className="qp-admin-form">
                    <label>
                      Category
                      <input
                        type="text"
                        value={editorForm.category}
                        onChange={(event) => setEditorForm((prev) => ({ ...prev, category: event.target.value }))}
                        placeholder="e.g. Algorithms"
                      />
                    </label>
                    <label>
                      Difficulty
                      <select
                        value={editorForm.difficulty}
                        onChange={(event) => setEditorForm((prev) => ({ ...prev, difficulty: event.target.value }))}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </label>
                    <label>
                      Question
                      <input
                        type="text"
                        value={editorForm.question}
                        onChange={(event) => setEditorForm((prev) => ({ ...prev, question: event.target.value }))}
                        placeholder="Enter quiz question"
                      />
                    </label>
                    <label>
                      Options (one per line)
                      <textarea
                        rows={4}
                        value={editorForm.optionsText}
                        onChange={(event) => setEditorForm((prev) => ({ ...prev, optionsText: event.target.value }))}
                        placeholder={'Option 1\nOption 2\nOption 3\nOption 4'}
                      />
                    </label>
                    <label>
                      Correct Option Index (0-based)
                      <input
                        type="number"
                        min="0"
                        value={editorForm.answerIndex}
                        onChange={(event) => setEditorForm((prev) => ({ ...prev, answerIndex: Number(event.target.value) }))}
                      />
                    </label>
                    <label>
                      Explanation
                      <textarea
                        rows={3}
                        value={editorForm.explanation}
                        onChange={(event) => setEditorForm((prev) => ({ ...prev, explanation: event.target.value }))}
                        placeholder="Why this answer is correct"
                      />
                    </label>

                    {editorError && <p className="qp-warning">{editorError}</p>}

                    <div className="qp-actions">
                      <button
                        type="button"
                        className="qp-secondary-btn"
                        onClick={() => {
                          setEditorOpen(false)
                          setEditingId('')
                          setEditorError('')
                        }}
                      >
                        Cancel
                      </button>
                      <button type="button" className="qp-primary-btn" onClick={saveQuestion}>
                        {editingId ? 'Update Question' : 'Create Question'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="qp-admin-table-wrap">
                  <table className="qp-admin-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Category</th>
                        <th>Difficulty</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizBank.map((item) => (
                        <tr key={item.id}>
                          <td>{item.question}</td>
                          <td>{item.category}</td>
                          <td>{item.difficulty}</td>
                          <td>
                            <div className="qp-admin-actions">
                              <button type="button" className="qp-secondary-btn" onClick={() => openEditEditor(item)}>Edit</button>
                              <button type="button" className="qp-delete-btn" onClick={() => deleteQuestion(item.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'quiz' && currentQuestion && (
          <div className="qp-quiz">
            <div className="qp-top-strip">
              <div>
                Q{currentIndex + 1} / {questions.length}
              </div>
              <div>Streak: {streak}</div>
              <div className={timeLeft <= 10 ? 'qp-timer urgent' : 'qp-timer'}>{timeLeft}s</div>
            </div>

            <div className="qp-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="qp-tags">
              <span>{currentQuestion.category}</span>
              <span>{currentQuestion.difficulty}</span>
            </div>

            <h2>{currentQuestion.question}</h2>

            <div className="qp-options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedOption(index)}
                  className={selectedOption === index ? 'is-selected' : ''}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                </button>
              ))}
            </div>

            <div className="qp-actions">
              <button type="button" className="qp-secondary-btn" onClick={() => submitAnswer(null, false)}>
                Skip
              </button>
              <button
                type="button"
                className="qp-primary-btn"
                onClick={() => submitAnswer(selectedOption, false)}
                disabled={selectedOption === null}
              >
                Submit & Next
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && analytics && (
          <div className="qp-result">
            <h2>Performance Analytics</h2>

            <div className="qp-stats-grid">
              <article><p>Score</p><h3>{analytics.correct}/{analytics.total}</h3></article>
              <article><p>Score %</p><h3>{analytics.scorePercent}%</h3></article>
              <article><p>Accuracy</p><h3>{analytics.accuracy}%</h3></article>
              <article><p>Avg Time</p><h3>{analytics.avgTime}s</h3></article>
              <article><p>Max Streak</p><h3>{analytics.maxStreak}</h3></article>
              <article><p>Timed Out</p><h3>{analytics.timedOut}</h3></article>
            </div>

            <div className="qp-breakdown-grid">
              <section>
                <h3>By Category</h3>
                <ul>
                  {Object.entries(analytics.categoryStats).map(([name, stat]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <span>{stat.correct}/{stat.total}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3>By Difficulty</h3>
                <ul>
                  {Object.entries(analytics.difficultyStats).map(([name, stat]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <span>{stat.correct}/{stat.total}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <details className="qp-review">
              <summary>Review Answers</summary>
              <ul>
                {questions.map((question, index) => {
                  const answer = answers[question.id]
                  const selectedLabel =
                    answer?.selectedIndex === null || answer?.selectedIndex === undefined
                      ? 'Skipped'
                      : question.options[answer.selectedIndex]
                  return (
                    <li key={question.id}>
                      <p>{index + 1}. {question.question}</p>
                      <p>
                        Your Answer: <strong>{selectedLabel}</strong>
                      </p>
                      <p>
                        Correct Answer: <strong>{question.options[question.answer]}</strong>
                      </p>
                      <p className={answer?.isCorrect ? 'qp-ok' : 'qp-bad'}>{answer?.isCorrect ? 'Correct' : 'Incorrect'}</p>
                      <p className="qp-explain">{question.explanation}</p>
                    </li>
                  )
                })}
              </ul>
            </details>

            <div className="qp-actions">
              <button type="button" className="qp-secondary-btn" onClick={resetToSetup}>Back to Setup</button>
              <button type="button" className="qp-primary-btn" onClick={startQuiz}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
