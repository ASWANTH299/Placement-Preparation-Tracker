const LearningPath = require('../models/LearningPath');
const CompanyQuestion = require('../models/CompanyQuestion');
const Note = require('../models/Note');

const TOPICS = [
  'Arrays',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Trees',
  'Binary Search Trees',
  'Heaps',
  'Graphs',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Recursion',
  'Backtracking',
  'Trie',
  'Segment Trees',
  'Bit Manipulation',
  'Sliding Window',
  'Two Pointer Technique',
  'Binary Search',
  'System Design Basics',
  'Concurrency Basics'
];

const QUESTION_SEED = [
  ['Two Sum', 'Amazon', 'Arrays', 'Easy'],
  ['Longest Substring Without Repeating Characters', 'Amazon', 'Sliding Window', 'Medium'],
  ['Valid Parentheses', 'Google', 'Stacks', 'Easy'],
  ['Merge Intervals', 'Meta', 'Arrays', 'Medium'],
  ['Binary Tree Level Order Traversal', 'Microsoft', 'Trees', 'Medium'],
  ['LRU Cache', 'Google', 'System Design Basics', 'Hard'],
  ['Detect Cycle in Linked List', 'Microsoft', 'Linked Lists', 'Easy'],
  ['Kth Largest Element in an Array', 'Meta', 'Heaps', 'Medium'],
  ['Number of Islands', 'Amazon', 'Graphs', 'Medium'],
  ['Course Schedule', 'Google', 'Graphs', 'Medium'],
  ['Top K Frequent Elements', 'Meta', 'Heaps', 'Medium'],
  ['Climbing Stairs', 'Amazon', 'Dynamic Programming', 'Easy'],
  ['Coin Change', 'Microsoft', 'Dynamic Programming', 'Medium'],
  ['Word Ladder', 'Google', 'Graphs', 'Hard'],
  ['Minimum Window Substring', 'Meta', 'Sliding Window', 'Hard']
];

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const topicProblems = (topic) => {
  return Array.from({ length: 5 }).map((_, index) => ({
    title: `${topic} Problem ${index + 1}`,
    description: `Solve a core ${topic} pattern. Focus on correctness, edge cases, and optimal complexity.`,
    pseudocode: `1. Parse input\n2. Apply ${topic} strategy\n3. Track state and update answer\n4. Return result`,
    javaSolution: `class Solution {\n  public int solve(int[] nums) {\n    int answer = 0;\n    for (int value : nums) answer += value;\n    return answer;\n  }\n}`
  }));
};

const topicEntry = (topic, index) => ({
  topicId: slugify(topic),
  order: index + 1,
  week: index + 1,
  topic,
  description: `${topic} fundamentals and interview-ready patterns.`,
  explanation: `${topic} is a high-impact DSA area used in interviews. Learn representations, trade-offs, and common templates.`,
  javaSyntaxExample: `// ${topic} Java starter\nclass TopicDemo {\n  public static void main(String[] args) {\n    System.out.println("${topic}");\n  }\n}`,
  pseudocodeExplanation: `Understand the core template first, then map each problem to that template and optimize.`,
  problems: topicProblems(topic),
  estimatedDurationHours: 6,
  difficulty: index < 6 ? 'Beginner' : index < 14 ? 'Intermediate' : 'Advanced',
  resources: [],
  subtopics: [],
  status: 'Active'
});

const questionEntry = ([title, company, topic, difficulty]) => ({
  title,
  company,
  topics: [topic],
  difficulty,
  description: `${title} - full problem statement with interview constraints and expected behavior.`,
  exampleInput: 'Input: sample input',
  exampleOutput: 'Output: sample output',
  inputOutputExamples: [
    {
      input: 'Example input 1',
      output: 'Example output 1',
      explanation: 'Walk through one representative execution path.'
    }
  ],
  explanation: `Detailed explanation for ${title}.`,
  pseudocode: `1. Initialize required data structures\n2. Traverse input\n3. Apply decision logic\n4. Return final answer`,
  javaSolution: `class Solution {\n  public int solve(int[] nums) {\n    return nums.length;\n  }\n}`,
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  constraints: 'Use optimized approach suitable for interview time limits.',
  hints: 'Try using a map or two-pointer pattern depending on the problem.',
  solutionApproach: 'Start with brute force, then optimize to the target complexity.',
  solutionCode: `class Solution {\n  public int solve(int[] nums) {\n    return nums.length;\n  }\n}`,
  status: 'Active'
});

const noteEntry = (topic) => ({
  studentId: null,
  title: `${topic} Notes`,
  content: `Concept:\n${topic} core ideas, constraints, and usage patterns.\n\nPseudocode:\n1. Initialize\n2. Iterate and update\n3. Return answer\n\nJava Example:\nclass Demo {\n  int run(int[] nums) {\n    return nums.length;\n  }\n}`,
  topics: [topic],
  companies: [],
  visibility: 'Public'
});

async function seedLearningPaths() {
  for (const [index, topic] of TOPICS.entries()) {
    await LearningPath.updateOne(
      { topicId: slugify(topic) },
      { $setOnInsert: topicEntry(topic, index) },
      { upsert: true }
    );
  }
}

async function seedQuestions() {
  for (const row of QUESTION_SEED) {
    await CompanyQuestion.updateOne(
      { title: row[0] },
      { $setOnInsert: questionEntry(row) },
      { upsert: true }
    );
  }
}

async function seedNotes() {
  for (const topic of TOPICS) {
    await Note.updateOne(
      { title: `${topic} Notes`, studentId: null },
      { $setOnInsert: noteEntry(topic) },
      { upsert: true }
    );
  }
}

async function seedDefaultContent() {
  await Promise.all([
    seedLearningPaths(),
    seedQuestions(),
    seedNotes()
  ]);
}

module.exports = seedDefaultContent;
