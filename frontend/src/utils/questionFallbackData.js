const fallbackQuestionSeed = [
  {
    _id: 'two-sum-fallback',
    title: 'Two Sum',
    company: 'Amazon',
    topic: 'Arrays',
    topics: ['Arrays'],
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution and you may not use the same element twice.',
    inputOutputExamples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' }],
    explanation: 'Scan once and keep a hash map from value to index. For each current value x, check whether target-x is already seen.',
    pseudocode: '1. map = {}\n2. for i in 0..n-1:\n3.   need = target - nums[i]\n4.   if need in map: return [map[need], i]\n5.   map[nums[i]] = i',
    javaSolution: 'class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n      int need = target - nums[i];\n      if (map.containsKey(need)) return new int[] { map.get(need), i };\n      map.put(nums[i], i);\n    }\n    return new int[] {-1, -1};\n  }\n}',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  },
  {
    _id: 'longest-substring-fallback',
    title: 'Longest Substring Without Repeating Characters',
    company: 'Amazon',
    topic: 'Sliding Window',
    topics: ['Sliding Window'],
    difficulty: 'Medium',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    inputOutputExamples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'Longest substring without repeat is "abc".' }],
    explanation: 'Use sliding window with map of last seen index. Move left pointer when duplicate found inside window.',
    pseudocode: '1. left = 0, best = 0\n2. for right in 0..n-1:\n3.   if s[right] seen and seen[s[right]] >= left: left = seen[s[right]] + 1\n4.   seen[s[right]] = right\n5.   best = max(best, right-left+1)',
    javaSolution: 'class Solution {\n  public int lengthOfLongestSubstring(String s) {\n    java.util.Map<Character, Integer> seen = new java.util.HashMap<>();\n    int left = 0, best = 0;\n    for (int right = 0; right < s.length(); right++) {\n      char c = s.charAt(right);\n      if (seen.containsKey(c) && seen.get(c) >= left) left = seen.get(c) + 1;\n      seen.put(c, right);\n      best = Math.max(best, right - left + 1);\n    }\n    return best;\n  }\n}',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(n, alphabet))'
  },
  {
    _id: 'valid-parentheses-fallback',
    title: 'Valid Parentheses',
    company: 'Google',
    topic: 'Stacks',
    topics: ['Stacks'],
    difficulty: 'Easy',
    description: 'Given a string containing only parentheses characters, determine if the input string is valid.',
    inputOutputExamples: [{ input: 's = "()[]{}"', output: 'true', explanation: 'All brackets close in correct order.' }],
    explanation: 'Use stack for opening brackets and match each closing bracket against stack top.',
    pseudocode: '1. stack = []\n2. for c in s:\n3.   if c opening: push\n4.   else if stack empty or not matching: return false\n5. return stack empty',
    javaSolution: `class Solution {
  public boolean isValid(String s) {
    java.util.Deque<Character> st = new java.util.ArrayDeque<>();
    for (char c : s.toCharArray()) {
      if (c == '(' || c == '[' || c == '{') st.push(c);
      else {
        if (st.isEmpty()) return false;
        char t = st.pop();
        if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{')) return false;
      }
    }
    return st.isEmpty();
  }
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  },
  {
    _id: 'merge-intervals-fallback',
    title: 'Merge Intervals',
    company: 'Meta',
    topic: 'Arrays',
    topics: ['Arrays'],
    difficulty: 'Medium',
    description: 'Given an array of intervals, merge all overlapping intervals and return a list of non-overlapping intervals.',
    inputOutputExamples: [{ input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap.' }],
    explanation: 'Sort by start then iterate and merge with previous when overlapping.',
    pseudocode: '1. sort intervals by start\n2. result = []\n3. for interval in intervals:\n4.   if result empty or no overlap: append\n5.   else merge with last',
    javaSolution: 'class Solution {\n  public int[][] merge(int[][] intervals) {\n    java.util.Arrays.sort(intervals, (a,b) -> Integer.compare(a[0], b[0]));\n    java.util.List<int[]> res = new java.util.ArrayList<>();\n    for (int[] in : intervals) {\n      if (res.isEmpty() || res.get(res.size()-1)[1] < in[0]) res.add(in);\n      else res.get(res.size()-1)[1] = Math.max(res.get(res.size()-1)[1], in[1]);\n    }\n    return res.toArray(new int[0][]);\n  }\n}',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)'
  },
  {
    _id: 'bt-level-order-fallback',
    title: 'Binary Tree Level Order Traversal',
    company: 'Microsoft',
    topic: 'Trees',
    topics: ['Trees'],
    difficulty: 'Medium',
    description: 'Return the level order traversal of a binary tree nodes values.',
    inputOutputExamples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'BFS by levels.' }],
    explanation: 'Use queue and process nodes level by level.',
    pseudocode: '1. if root null return []\n2. queue = [root]\n3. while queue not empty: process size nodes and push children',
    javaSolution: 'class Solution {\n  public java.util.List<java.util.List<Integer>> levelOrder(TreeNode root) { return new java.util.ArrayList<>(); }\n}',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  },
  {
    _id: 'lru-cache-fallback',
    title: 'LRU Cache',
    company: 'Google',
    topic: 'System Design Basics',
    topics: ['System Design Basics'],
    difficulty: 'Hard',
    description: 'Design a data structure that follows Least Recently Used cache policy with O(1) get and put.',
    inputOutputExamples: [{ input: 'capacity = 2; put/get operations', output: 'values per get', explanation: 'Evict least recently used key on overflow.' }],
    explanation: 'Combine hash map and doubly linked list for O(1) operations.',
    pseudocode: '1. map key->node\n2. list keeps most recent at head\n3. get: move node to head\n4. put: insert/update and evict tail if needed',
    javaSolution: 'class LRUCache { public LRUCache(int capacity) {} public int get(int key){ return -1; } public void put(int key, int value){} }',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(capacity)'
  },
  {
    _id: 'detect-cycle-list-fallback',
    title: 'Detect Cycle in Linked List',
    company: 'Microsoft',
    topic: 'Linked Lists',
    topics: ['Linked Lists'],
    difficulty: 'Easy',
    description: 'Determine if a linked list has a cycle.',
    inputOutputExamples: [{ input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'Tail links back to node index 1.' }],
    explanation: 'Use Floyd slow/fast pointers; if they meet there is a cycle.',
    pseudocode: '1. slow=head, fast=head\n2. move slow by 1, fast by 2\n3. if meet return true\n4. if fast reaches null return false',
    javaSolution: 'class Solution { public boolean hasCycle(ListNode head){ return false; } }',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    _id: 'kth-largest-fallback',
    title: 'Kth Largest Element in an Array',
    company: 'Meta',
    topic: 'Heaps',
    topics: ['Heaps'],
    difficulty: 'Medium',
    description: 'Find the kth largest element in an unsorted array.',
    inputOutputExamples: [{ input: 'nums=[3,2,1,5,6,4], k=2', output: '5', explanation: '2nd largest is 5.' }],
    explanation: 'Use min-heap of size k or quickselect.',
    pseudocode: '1. heap = min-heap\n2. push each num\n3. if heap size > k pop\n4. answer = heap top',
    javaSolution: 'class Solution { public int findKthLargest(int[] nums, int k){ return 0; } }',
    timeComplexity: 'O(n log k)',
    spaceComplexity: 'O(k)'
  },
  {
    _id: 'number-of-islands-fallback',
    title: 'Number of Islands',
    company: 'Amazon',
    topic: 'Graphs',
    topics: ['Graphs'],
    difficulty: 'Medium',
    description: 'Count islands in a 2D grid where 1 is land and 0 is water.',
    inputOutputExamples: [{ input: 'grid with connected components', output: 'island count', explanation: 'Run DFS/BFS from every unvisited land cell.' }],
    explanation: 'Traverse grid and flood-fill each new island.',
    pseudocode: '1. count=0\n2. for each cell: if land and unvisited: dfs; count++\n3. return count',
    javaSolution: 'class Solution { public int numIslands(char[][] grid){ return 0; } }',
    timeComplexity: 'O(m*n)',
    spaceComplexity: 'O(m*n)'
  },
  {
    _id: 'course-schedule-fallback',
    title: 'Course Schedule',
    company: 'Google',
    topic: 'Graphs',
    topics: ['Graphs'],
    difficulty: 'Medium',
    description: 'Given numCourses and prerequisites, determine if all courses can be finished.',
    inputOutputExamples: [{ input: 'numCourses=2, prerequisites=[[1,0]]', output: 'true', explanation: 'No cycle in dependency graph.' }],
    explanation: 'Detect cycle using topological sort (Kahn) or DFS colors.',
    pseudocode: '1. build graph and indegree\n2. push indegree 0 nodes\n3. process queue and relax edges\n4. finished if processed==numCourses',
    javaSolution: 'class Solution { public boolean canFinish(int numCourses, int[][] prerequisites){ return true; } }',
    timeComplexity: 'O(V+E)',
    spaceComplexity: 'O(V+E)'
  },
  {
    _id: 'top-k-frequent-fallback',
    title: 'Top K Frequent Elements',
    company: 'Meta',
    topic: 'Heaps',
    topics: ['Heaps'],
    difficulty: 'Medium',
    description: 'Return k most frequent elements from an integer array.',
    inputOutputExamples: [{ input: 'nums=[1,1,1,2,2,3], k=2', output: '[1,2]', explanation: '1 occurs 3 times, 2 occurs 2 times.' }],
    explanation: 'Count frequency then use bucket sort or min heap.',
    pseudocode: '1. freq map\n2. heap by count\n3. keep size k\n4. extract keys',
    javaSolution: 'class Solution { public int[] topKFrequent(int[] nums, int k){ return new int[0]; } }',
    timeComplexity: 'O(n log k)',
    spaceComplexity: 'O(n)'
  },
  {
    _id: 'climbing-stairs-fallback',
    title: 'Climbing Stairs',
    company: 'Amazon',
    topic: 'Dynamic Programming',
    topics: ['Dynamic Programming'],
    difficulty: 'Easy',
    description: 'You are climbing stairs, each time can climb 1 or 2. Count distinct ways to reach n.',
    inputOutputExamples: [{ input: 'n=3', output: '3', explanation: 'Ways: 1+1+1, 1+2, 2+1.' }],
    explanation: 'Classic Fibonacci-style DP.',
    pseudocode: '1. if n<=2 return n\n2. iterate with prev2, prev1\n3. current=prev1+prev2',
    javaSolution: 'class Solution { public int climbStairs(int n){ return n; } }',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    _id: 'coin-change-fallback',
    title: 'Coin Change',
    company: 'Microsoft',
    topic: 'Dynamic Programming',
    topics: ['Dynamic Programming'],
    difficulty: 'Medium',
    description: 'Given coins and amount, return minimum number of coins to make amount, else -1.',
    inputOutputExamples: [{ input: 'coins=[1,2,5], amount=11', output: '3', explanation: '11 = 5 + 5 + 1' }],
    explanation: 'Bottom-up DP with dp[i] minimum coins for sum i.',
    pseudocode: '1. dp[0]=0, others=INF\n2. for i in 1..amount:\n3.   for c in coins: dp[i]=min(dp[i], dp[i-c]+1)',
    javaSolution: 'class Solution { public int coinChange(int[] coins, int amount){ return -1; } }',
    timeComplexity: 'O(amount * coins)',
    spaceComplexity: 'O(amount)'
  },
  {
    _id: 'word-ladder-fallback',
    title: 'Word Ladder',
    company: 'Google',
    topic: 'Graphs',
    topics: ['Graphs'],
    difficulty: 'Hard',
    description: 'Find shortest transformation sequence length from beginWord to endWord changing one letter at a time.',
    inputOutputExamples: [{ input: 'begin=hit, end=cog, wordList=[hot,dot,dog,lot,log,cog]', output: '5', explanation: 'hit->hot->dot->dog->cog' }],
    explanation: 'Use BFS over implicit graph of one-letter transformations.',
    pseudocode: '1. queue beginWord with depth 1\n2. pop and generate neighbors\n3. if neighbor is end return depth+1',
    javaSolution: 'class Solution { public int ladderLength(String beginWord, String endWord, java.util.List<String> wordList){ return 0; } }',
    timeComplexity: 'O(N * L * 26)',
    spaceComplexity: 'O(N)'
  },
  {
    _id: 'minimum-window-substring-fallback',
    title: 'Minimum Window Substring',
    company: 'Meta',
    topic: 'Sliding Window',
    topics: ['Sliding Window'],
    difficulty: 'Hard',
    description: 'Given strings s and t, return the minimum window in s that contains all characters of t.',
    inputOutputExamples: [{ input: 's=ADOBECODEBANC, t=ABC', output: 'BANC', explanation: 'Smallest valid window.' }],
    explanation: 'Sliding window with required character counts and formed counter.',
    pseudocode: '1. need map from t\n2. expand right and update formed\n3. while formed==required: shrink left and record best',
    javaSolution: 'class Solution { public String minWindow(String s, String t){ return ""; } }',
    timeComplexity: 'O(|s| + |t|)',
    spaceComplexity: 'O(|alphabet|)'
  }
]

const getDefaultConstraint = (difficulty) => {
  if (difficulty === 'Easy') return '1 <= n <= 10^5; target output must be exact and deterministic.'
  if (difficulty === 'Medium') return '1 <= n <= 2 * 10^5; design an optimized solution better than brute force where applicable.'
  return 'Assume interview-scale limits; brute force may time out. Prefer optimal time-space trade-offs.'
}

export const fallbackQuestions = fallbackQuestionSeed.map((question) => {
  const firstExample = question.inputOutputExamples?.[0]
  const topicName = question.topic || question.topics?.[0] || 'the given domain'

  return {
    ...question,
    inputFormat: question.inputFormat || `Input follows the ${topicName} problem statement and should be parsed exactly as specified.`,
    outputFormat: question.outputFormat || 'Output must match the required result format exactly (array/string/integer/boolean as asked).',
    constraints: question.constraints || getDefaultConstraint(question.difficulty),
    exampleInput: question.exampleInput || firstExample?.input || 'N/A',
    exampleOutput: question.exampleOutput || firstExample?.output || 'N/A'
  }
})

export const fallbackQuestionById = fallbackQuestions.reduce((acc, question) => {
  acc[question._id] = question
  return acc
}, {})
