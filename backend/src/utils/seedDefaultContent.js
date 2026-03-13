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

const TOPIC_OVERVIEWS = {
  Arrays: 'Arrays provide O(1) random access and are central to indexing, prefix/suffix, and in-place transformation patterns.',
  'Linked Lists': 'Linked Lists support pointer-based traversal and efficient insertion/deletion; interviews focus on pointer safety and list rewiring.',
  Stacks: 'Stacks are LIFO structures used in expression parsing, monotonic processing, and nested validation.',
  Queues: 'Queues are FIFO structures useful for BFS traversal, scheduling, and level-order processing.',
  'Trees': 'Trees model hierarchical data; core patterns are DFS/BFS, subtree aggregation, and path-based decisions.',
  'Binary Search Trees': 'BST ordering enables efficient search and range decisions through left/right branch pruning.',
  Heaps: 'Heaps are priority-based structures used for top-k, scheduling, and streaming optimization questions.',
  Graphs: 'Graphs model relationships and dependencies; interview focus includes traversal, cycle checks, and shortest path logic.',
  'Dynamic Programming': 'DP solves overlapping subproblems through state design, transition relation, and memoization/tabulation.',
  'Greedy Algorithms': 'Greedy methods choose locally optimal actions and require proof of global correctness.',
  Recursion: 'Recursion breaks problems into smaller identical forms and relies on clear base case and return composition.',
  Backtracking: 'Backtracking explores decision trees with pruning and precise undo operations for state consistency.',
  Trie: 'Trie stores strings by prefix and enables efficient prefix queries and dictionary matching operations.',
  'Segment Trees': 'Segment Trees answer interval queries and updates efficiently using divide-and-conquer tree nodes.',
  'Bit Manipulation': 'Bit operations provide compact and fast solutions for masking, parity, and subset-state logic.',
  'Sliding Window': 'Sliding Window maintains a dynamic range and reduces repeated work in substring/subarray problems.',
  'Two Pointer Technique': 'Two pointers optimize comparisons in sorted arrays, partitions, and pair-based constraints.',
  'Binary Search': 'Binary Search narrows monotonic search spaces by maintaining strict loop invariants.',
  'System Design Basics': 'System design basics cover scalability, reliability, data modeling, caching, and API/service decomposition.',
  'Concurrency Basics': 'Concurrency basics focus on safe parallel execution, synchronization, race conditions, and deadlock avoidance.'
};

const TOPIC_PSEUDOCODE = {
  Arrays: '1. Traverse once\n2. Maintain running state\n3. Update answer using invariant\n4. Return final value',
  'Linked Lists': '1. Track current/previous pointers\n2. Move through list safely\n3. Rewire links if required\n4. Return head/result',
  Stacks: '1. Iterate elements\n2. Pop while condition fails\n3. Push current candidate\n4. Build output from stack',
  Queues: '1. Push start node/item\n2. Process front\n3. Push valid next items\n4. Continue until empty',
  Trees: '1. Handle null base case\n2. Recurse on children\n3. Combine child results\n4. Return subtree answer',
  'Binary Search Trees': '1. Compare key with root\n2. Move left/right accordingly\n3. Update answer on match condition\n4. Stop when null',
  Heaps: '1. Push element into heap\n2. If size exceeds target, pop root\n3. Continue for all elements\n4. Read answer from heap',
  Graphs: '1. Build adjacency list\n2. Mark visited nodes\n3. Traverse with BFS/DFS\n4. Aggregate problem-specific result',
  'Dynamic Programming': '1. Define DP state\n2. Set base cases\n3. Fill transition in dependency order\n4. Return target state',
  'Greedy Algorithms': '1. Sort by greedy key\n2. Select best feasible option\n3. Preserve constraints\n4. Return constructed result',
  Recursion: '1. Define base case\n2. Recurse on smaller input\n3. Combine recursive outputs\n4. Return composed answer',
  Backtracking: '1. Choose option\n2. Recurse deeper\n3. Record valid state\n4. Undo and continue',
  Trie: '1. Insert/query per character\n2. Create or move child node\n3. Mark terminal state\n4. Return prefix/word status',
  'Segment Trees': '1. Build tree by ranges\n2. Query by overlap type\n3. Merge left/right results\n4. Propagate updates upward',
  'Bit Manipulation': '1. Define mask/bit rule\n2. Apply shift/and/or/xor\n3. Check resulting bits\n4. Return computed value',
  'Sliding Window': '1. Expand right pointer\n2. Shrink left while invalid\n3. Update best answer\n4. Continue until end',
  'Two Pointer Technique': '1. Initialize left/right\n2. Evaluate condition\n3. Move pointer(s) by rule\n4. Track best/target answer',
  'Binary Search': '1. Set low/high bounds\n2. Compute mid\n3. Move boundary by predicate\n4. Return final boundary/index',
  'System Design Basics': '1. Clarify requirements\n2. Estimate scale\n3. Design services and storage\n4. Analyze bottlenecks/trade-offs',
  'Concurrency Basics': '1. Identify shared state\n2. Protect critical sections\n3. Use safe communication primitives\n4. Validate liveness/safety'
};

const TOPIC_JAVA_EXAMPLES = {
  Arrays: `class ArraysDemo {\n  int maxSubarray(int[] nums) {\n    int best = Integer.MIN_VALUE, curr = 0;\n    for (int value : nums) {\n      curr = Math.max(value, curr + value);\n      best = Math.max(best, curr);\n    }\n    return best;\n  }\n}`,
  'Linked Lists': `class LinkedListsDemo {\n  static class Node { int val; Node next; Node(int v) { val = v; } }\n  Node reverse(Node head) {\n    Node prev = null, curr = head;\n    while (curr != null) {\n      Node nxt = curr.next;\n      curr.next = prev;\n      prev = curr;\n      curr = nxt;\n    }\n    return prev;\n  }\n}`,
  Stacks: `class StacksDemo {\n  boolean balanced(String s) {\n    java.util.Deque<Character> st = new java.util.ArrayDeque<>();\n    for (char c : s.toCharArray()) {\n      if (c == '(') st.push(')');\n      else if (c == '[') st.push(']');\n      else if (c == '{') st.push('}');\n      else if (st.isEmpty() || st.pop() != c) return false;\n    }\n    return st.isEmpty();\n  }\n}`,
  Queues: `class QueuesDemo {\n  int process(int[] arr) {\n    java.util.Queue<Integer> q = new java.util.ArrayDeque<>();\n    for (int v : arr) q.offer(v);\n    int sum = 0;\n    while (!q.isEmpty()) sum += q.poll();\n    return sum;\n  }\n}`,
  Trees: `class TreesDemo {\n  static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }\n  int height(TreeNode root) {\n    if (root == null) return 0;\n    return 1 + Math.max(height(root.left), height(root.right));\n  }\n}`,
  'Binary Search Trees': `class BinarySearchTreesDemo {\n  static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }\n  boolean find(TreeNode root, int key) {\n    while (root != null) {\n      if (root.val == key) return true;\n      root = key < root.val ? root.left : root.right;\n    }\n    return false;\n  }\n}`,
  Heaps: `class HeapsDemo {\n  int kthLargest(int[] nums, int k) {\n    java.util.PriorityQueue<Integer> pq = new java.util.PriorityQueue<>();\n    for (int n : nums) {\n      pq.offer(n);\n      if (pq.size() > k) pq.poll();\n    }\n    return pq.peek();\n  }\n}`,
  Graphs: `class GraphsDemo {\n  void dfs(int node, java.util.List<java.util.List<Integer>> g, boolean[] seen) {\n    seen[node] = true;\n    for (int nxt : g.get(node)) if (!seen[nxt]) dfs(nxt, g, seen);\n  }\n}`,
  'Dynamic Programming': `class DynamicProgrammingDemo {\n  int fib(int n) {\n    if (n <= 1) return n;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }\n    return b;\n  }\n}`,
  'Greedy Algorithms': `class GreedyAlgorithmsDemo {\n  int minCoins(int[] coins, int amount) {\n    java.util.Arrays.sort(coins);\n    int used = 0;\n    for (int i = coins.length - 1; i >= 0 && amount > 0; i--) {\n      while (amount >= coins[i]) { amount -= coins[i]; used++; }\n    }\n    return amount == 0 ? used : -1;\n  }\n}`,
  Recursion: `class RecursionDemo {\n  int factorial(int n) {\n    return n <= 1 ? 1 : n * factorial(n - 1);\n  }\n}`,
  Backtracking: `class BacktrackingDemo {\n  void generate(int idx, int[] nums, java.util.List<Integer> cur, java.util.List<java.util.List<Integer>> out) {\n    if (idx == nums.length) { out.add(new java.util.ArrayList<>(cur)); return; }\n    cur.add(nums[idx]); generate(idx + 1, nums, cur, out); cur.remove(cur.size() - 1);\n    generate(idx + 1, nums, cur, out);\n  }\n}`,
  Trie: `class TrieDemo {\n  static class Node { Node[] next = new Node[26]; boolean end; }\n  Node root = new Node();\n  void insert(String word) {\n    Node cur = root;\n    for (char ch : word.toCharArray()) {\n      int i = ch - 'a';\n      if (cur.next[i] == null) cur.next[i] = new Node();\n      cur = cur.next[i];\n    }\n    cur.end = true;\n  }\n}`,
  'Segment Trees': `class SegmentTreesDemo {\n  int[] tree;\n  SegmentTreesDemo(int n) { tree = new int[4 * n]; }\n  int query(int node, int l, int r, int ql, int qr) {\n    if (qr < l || r < ql) return 0;\n    if (ql <= l && r <= qr) return tree[node];\n    int m = (l + r) / 2;\n    return query(node * 2, l, m, ql, qr) + query(node * 2 + 1, m + 1, r, ql, qr);\n  }\n}`,
  'Bit Manipulation': `class BitManipulationDemo {\n  boolean powerOfTwo(int n) {\n    return n > 0 && (n & (n - 1)) == 0;\n  }\n}`,
  'Sliding Window': `class SlidingWindowDemo {\n  int longestUnique(String s) {\n    int[] idx = new int[128];\n    java.util.Arrays.fill(idx, -1);\n    int left = 0, best = 0;\n    for (int right = 0; right < s.length(); right++) {\n      char c = s.charAt(right);\n      if (idx[c] >= left) left = idx[c] + 1;\n      idx[c] = right;\n      best = Math.max(best, right - left + 1);\n    }\n    return best;\n  }\n}`,
  'Two Pointer Technique': `class TwoPointerTechniqueDemo {\n  boolean pairExists(int[] nums, int target) {\n    int left = 0, right = nums.length - 1;\n    while (left < right) {\n      int sum = nums[left] + nums[right];\n      if (sum == target) return true;\n      if (sum < target) left++; else right--;\n    }\n    return false;\n  }\n}`,
  'Binary Search': `class BinarySearchDemo {\n  int search(int[] nums, int target) {\n    int low = 0, high = nums.length - 1;\n    while (low <= high) {\n      int mid = low + (high - low) / 2;\n      if (nums[mid] == target) return mid;\n      if (nums[mid] < target) low = mid + 1;\n      else high = mid - 1;\n    }\n    return -1;\n  }\n}`,
  'System Design Basics': `class SystemDesignBasicsDemo {\n  String checklist() {\n    return "Requirements -> Capacity -> APIs -> Data model -> Caching -> Reliability -> Monitoring";\n  }\n}`,
  'Concurrency Basics': `class ConcurrencyBasicsDemo {\n  private int value = 0;\n  synchronized void increment() { value++; }\n  synchronized int get() { return value; }\n}`
};

const MUST_SOLVE_QUESTIONS = {
  Arrays: ['Two Sum', 'Best Time to Buy and Sell Stock', 'Product of Array Except Self', 'Maximum Subarray', 'Merge Intervals', 'Set Matrix Zeroes', 'Spiral Matrix', 'Rotate Image', 'Subarray Sum Equals K', 'Container With Most Water', '3Sum', 'Trapping Rain Water', 'Maximum Product Subarray', 'Find Pivot Index', 'Longest Consecutive Sequence'],
  'Linked Lists': ['Reverse Linked List', 'Merge Two Sorted Lists', 'Linked List Cycle', 'Linked List Cycle II', 'Remove Nth Node From End of List', 'Reorder List', 'Intersection of Two Linked Lists', 'Palindrome Linked List', 'Copy List with Random Pointer', 'Add Two Numbers', 'Swap Nodes in Pairs', 'Reverse Nodes in k-Group', 'Sort List', 'Flatten a Multilevel Doubly Linked List', 'Odd Even Linked List'],
  Stacks: ['Valid Parentheses', 'Min Stack', 'Evaluate Reverse Polish Notation', 'Daily Temperatures', 'Next Greater Element I', 'Next Greater Element II', 'Largest Rectangle in Histogram', 'Decode String', 'Basic Calculator II', 'Remove K Digits', 'Asteroid Collision', 'Online Stock Span', 'Simplify Path', 'Score of Parentheses', 'Car Fleet'],
  Queues: ['Implement Queue using Stacks', 'Design Circular Queue', 'Number of Recent Calls', 'Time Needed to Buy Tickets', 'Sliding Window Maximum', 'Binary Tree Level Order Traversal', 'Rotting Oranges', 'Open the Lock', 'Walls and Gates', 'Dota2 Senate', 'Moving Average from Data Stream', 'First Unique Character in a Stream', 'Design Hit Counter', 'Number of Islands BFS', 'Task Scheduler'],
  Trees: ['Binary Tree Inorder Traversal', 'Binary Tree Preorder Traversal', 'Binary Tree Postorder Traversal', 'Binary Tree Level Order Traversal', 'Maximum Depth of Binary Tree', 'Diameter of Binary Tree', 'Same Tree', 'Symmetric Tree', 'Path Sum', 'Binary Tree Right Side View', 'Lowest Common Ancestor of a Binary Tree', 'Serialize and Deserialize Binary Tree', 'Binary Tree Zigzag Level Order Traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'Balanced Binary Tree'],
  'Binary Search Trees': ['Validate Binary Search Tree', 'Kth Smallest Element in a BST', 'Lowest Common Ancestor of a BST', 'Insert into a BST', 'Delete Node in a BST', 'Search in a BST', 'Convert Sorted Array to BST', 'BST Iterator', 'Two Sum IV - Input is a BST', 'Range Sum of BST', 'Recover Binary Search Tree', 'Trim a BST', 'Convert BST to Greater Tree', 'Balance a BST', 'Closest Binary Search Tree Value'],
  Heaps: ['Kth Largest Element in an Array', 'Top K Frequent Elements', 'Merge k Sorted Lists', 'Find Median from Data Stream', 'Last Stone Weight', 'Task Scheduler', 'Reorganize String', 'K Closest Points to Origin', 'Furthest Building You Can Reach', 'Smallest Range Covering Elements from K Lists', 'IPO', 'Maximum Performance of a Team', 'Sort Characters by Frequency', 'Ugly Number II', 'Minimum Cost to Connect Sticks'],
  Graphs: ['Number of Islands', 'Clone Graph', 'Course Schedule', 'Course Schedule II', 'Pacific Atlantic Water Flow', 'Surrounded Regions', 'Rotting Oranges', 'Word Ladder', 'Network Delay Time', 'Cheapest Flights Within K Stops', 'Redundant Connection', 'Is Graph Bipartite', 'Number of Connected Components in an Undirected Graph', 'Alien Dictionary', 'Critical Connections in a Network'],
  'Dynamic Programming': ['Climbing Stairs', 'House Robber', 'House Robber II', 'Coin Change', 'Coin Change II', 'Longest Increasing Subsequence', 'Longest Common Subsequence', '0/1 Knapsack', 'Partition Equal Subset Sum', 'Edit Distance', 'Decode Ways', 'Unique Paths', 'Maximum Product Subarray', 'Best Time to Buy and Sell Stock with Cooldown', 'Target Sum'],
  'Greedy Algorithms': ['Jump Game', 'Jump Game II', 'Gas Station', 'Candy', 'Non-overlapping Intervals', 'Meeting Rooms II', 'Assign Cookies', 'Lemonade Change', 'Queue Reconstruction by Height', 'Partition Labels', 'Minimum Number of Arrows to Burst Balloons', 'Task Scheduler', 'Advantage Shuffle', 'Reorganize String', 'Bag of Tokens'],
  Recursion: ['Pow(x, n)', 'Fibonacci Number', 'Climbing Stairs', 'Generate Parentheses', 'Letter Combinations of a Phone Number', 'Combination Sum', 'Combination Sum II', 'Permutations', 'Subsets', 'Subsets II', 'N-Queens', 'Unique Paths', 'Decode Ways', 'Different Ways to Add Parentheses', 'Binary Tree Inorder Traversal'],
  Backtracking: ['N-Queens', 'Sudoku Solver', 'Word Search', 'Palindrome Partitioning', 'Combination Sum', 'Combination Sum II', 'Permutations', 'Permutations II', 'Subsets', 'Subsets II', 'Restore IP Addresses', 'Letter Combinations of a Phone Number', 'Generate Parentheses', 'Partition to K Equal Sum Subsets', 'Rat in a Maze'],
  Trie: ['Implement Trie (Prefix Tree)', 'Design Add and Search Words Data Structure', 'Word Search II', 'Replace Words', 'Map Sum Pairs', 'Longest Word in Dictionary', 'Search Suggestions System', 'Maximum XOR of Two Numbers in an Array', 'Implement Magic Dictionary', 'Concatenated Words', 'Stream of Characters', 'Prefix and Suffix Search', 'Palindrome Pairs', 'Camelcase Matching', 'Word Break with Trie'],
  'Segment Trees': ['Range Sum Query - Mutable', 'Range Minimum Query', 'Count of Smaller Numbers After Self', 'The Skyline Problem', 'Falling Squares', 'Range Module', 'My Calendar III', 'Longest Increasing Subsequence II', 'Handle Sum Queries After Update', 'Range Frequency Queries', 'Create Sorted Array through Instructions', 'Corporate Flight Bookings', 'NumArray with Updates', 'Segment Tree Lazy Propagation Template', 'K-th One Query in Binary Array'],
  'Bit Manipulation': ['Single Number', 'Single Number II', 'Number of 1 Bits', 'Counting Bits', 'Reverse Bits', 'Bitwise AND of Numbers Range', 'Sum of Two Integers', 'Missing Number', 'Power of Two', 'Power of Four', 'Subsets', 'Maximum XOR of Two Numbers in an Array', 'Gray Code', 'Divide Two Integers', 'Hamming Distance'],
  'Sliding Window': ['Longest Substring Without Repeating Characters', 'Minimum Window Substring', 'Permutation in String', 'Find All Anagrams in a String', 'Longest Repeating Character Replacement', 'Maximum Average Subarray I', 'Subarray Product Less Than K', 'Max Consecutive Ones III', 'Fruits Into Baskets', 'Longest Subarray of 1s After Deleting One Element', 'Minimum Size Subarray Sum', 'Sliding Window Maximum', 'Count Number of Nice Subarrays', 'Grumpy Bookstore Owner', 'Longest Turbulent Subarray'],
  'Two Pointer Technique': ['Two Sum II - Input Array Is Sorted', 'Container With Most Water', '3Sum', '4Sum', 'Remove Duplicates from Sorted Array', 'Move Zeroes', 'Valid Palindrome', 'Squares of a Sorted Array', 'Merge Sorted Array', 'Sort Colors', 'Trapping Rain Water', 'Backspace String Compare', 'Is Subsequence', 'Boats to Save People', 'Partition Labels'],
  'Binary Search': ['Binary Search', 'Search Insert Position', 'First Bad Version', 'Search in Rotated Sorted Array', 'Find Minimum in Rotated Sorted Array', 'Find Peak Element', 'Koko Eating Bananas', 'Capacity To Ship Packages Within D Days', 'Median of Two Sorted Arrays', 'Search a 2D Matrix', 'Time Based Key-Value Store', 'Find First and Last Position of Element in Sorted Array', 'Sqrt(x)', 'Split Array Largest Sum', 'Minimize Max Distance to Gas Station'],
  'System Design Basics': ['Design TinyURL', 'Design Twitter', 'Design LRU Cache Service', 'Design URL Shortener', 'Design Rate Limiter', 'Design Chat System', 'Design Notification System', 'Design News Feed', 'Design Ride Sharing System', 'Design File Storage Service', 'Design Video Streaming Platform', 'Design Search Autocomplete', 'Design Online Judge', 'Design Payment Wallet', 'Design Logging and Monitoring Pipeline'],
  'Concurrency Basics': ['Print in Order', 'Print FooBar Alternately', 'Print Zero Even Odd', 'Fizz Buzz Multithreaded', 'Building H2O', 'The Dining Philosophers', 'Traffic Light Controlled Intersection', 'Bounded Blocking Queue', 'Web Crawler Multithreaded', 'Design Thread-Safe LRU Cache', 'Producer Consumer Problem', 'Reader Writer Lock', 'Semaphore Based Barber Shop', 'Deadlock Detection Simulation', 'Thread-safe Singleton Pattern']
};

const MEMORY_SHEETS = {
  Arrays: ['Prefix sum: pref[i] = pref[i - 1] + a[i]', 'Subarray sum (l..r): pref[r] - pref[l - 1]', 'Kadane transition: curr = max(x, curr + x)', 'Two-pass optimization with prefix/suffix'],
  'Linked Lists': ['Fast/slow pointer for cycle and middle', 'Reverse template with prev/curr/next', 'Dummy node simplifies head updates', 'Always store next before rewiring'],
  Stacks: ['Monotonic stack for next greater/smaller', 'Push indices when position matters', 'Pop until invariant is restored', 'Balanced bracket mapping via expected closing'],
  Queues: ['BFS processes level by level', 'Deque supports O(1) front/back operations', 'Queue invariant: process in insertion order', 'For level size: iterate using current queue length'],
  Trees: ['DFS preorder/inorder/postorder patterns', 'Height recursion: 1 + max(left, right)', 'Path problems combine child contributions', 'Level order uses queue'],
  'Binary Search Trees': ['BST property: left < root < right', 'Inorder traversal gives sorted order', 'Kth smallest via inorder count', 'Insert/delete preserve BST invariants'],
  Heaps: ['Min-heap for k largest (size k)', 'Max-heap for repeated top extraction', 'Heap push/pop is O(log n)', 'Priority queue handles streaming data'],
  Graphs: ['Adjacency list for sparse graphs', 'Visited set prevents revisits', 'BFS for shortest unweighted path', 'Topo sort for DAG dependency order'],
  'Dynamic Programming': ['State definition is core', 'Transition from smaller solved states', 'Memoization top-down vs tabulation bottom-up', 'Space optimize with rolling variables when possible'],
  'Greedy Algorithms': ['Sort by greedy criterion', 'Local optimal choice each step', 'Need proof (exchange/invariant)', 'If proof fails, consider DP'],
  Recursion: ['Base case must terminate every path', 'Recurrence defines subproblem relation', 'Call stack depth affects memory O(h)', 'Memoization converts exponential to polynomial'],
  Backtracking: ['Choose -> Explore -> Unchoose', 'Prune invalid paths early', 'Use local path + global answer', 'State restoration is mandatory'],
  Trie: ['Each edge = character transition', 'Node has children + end flag', 'Insert/search are O(length)', 'Prefix queries stop at missing child'],
  'Segment Trees': ['Node stores range aggregate', 'Query splits by overlap type', 'Point update propagates upward', 'Lazy propagation for range updates'],
  'Bit Manipulation': ['n & (n - 1) removes lowest set bit', 'x ^ x = 0 and x ^ 0 = x', 'Use masks for set/clear/toggle bits', 'Shift operators for multiply/divide by powers of 2'],
  'Sliding Window': ['Maintain window validity before scoring answer', 'Frequency map + left/right pointers', 'Expand right, shrink left on violation', 'Answer often updated after each valid state'],
  'Two Pointer Technique': ['Sorted arrays enable directional pointer moves', 'left++ or right-- based on target relation', 'Use while(left < right)', 'Avoid duplicate results with skip loops'],
  'Binary Search': ['mid = low + (high - low) / 2', 'Invariant decides boundary updates', 'Search on answer uses monotonic predicate', 'End state gives first/last valid boundary'],
  'System Design Basics': ['Latency vs throughput trade-off', 'CAP and consistency decisions', 'Cache-aside pattern for read-heavy systems', 'Horizontal scaling + partitioning strategy'],
  'Concurrency Basics': ['Mutual exclusion for critical sections', 'Avoid deadlock: ordered lock acquisition', 'Producer-consumer via blocking queue', 'Prefer immutability to reduce shared state bugs']
};

const buildThirtyDaySchedule = (topic) => {
  return [
    `Day 1: Read ${topic} fundamentals and write one-page summary.`,
    `Day 2: Solve 3 easy ${topic} problems and track mistakes.`,
    `Day 3: Re-solve same 3 easy problems without references.`,
    `Day 4: Learn one core template and implement from scratch.`,
    `Day 5: Solve 2 medium ${topic} questions with timer (35 min each).`,
    `Day 6: Review complexity of all solved problems and optimize one solution.`,
    `Day 7: Mock round (60 min) with mixed easy/medium ${topic} set.`,
    `Day 8: Study advanced pattern 1 in ${topic}.`,
    `Day 9: Solve 2 medium + 1 hard question on advanced pattern 1.`,
    `Day 10: Debug-focused day: revisit all wrong submissions and fix reasoning.`,
    `Day 11: Study advanced pattern 2 in ${topic}.`,
    `Day 12: Solve 3 medium questions on advanced pattern 2.`,
    `Day 13: Write interview explanations for 5 solved problems.`,
    `Day 14: Weekly revision + 45-minute mock interview.`,
    `Day 15: Solve one company-tagged hard problem in ${topic}.`,
    `Day 16: Convert recursive solutions to iterative (or reverse) for 2 problems.`,
    `Day 17: Practice edge-case design for 6 problems.`,
    `Day 18: Solve 4 timed questions (mix from previous days).`,
    `Day 19: Learn optimization tricks and apply to 2 old solutions.`,
    `Day 20: Build a personal cheat sheet for ${topic}.`,
    `Day 21: Mock OA set with strict timer and no hints.`,
    `Day 22: Re-attempt day 21 questions and improve runtime.`,
    `Day 23: Solve 2 new hard problems or 4 medium if hard is too difficult.`,
    `Day 24: Whiteboard-style explanation practice (no IDE) for 3 problems.`,
    `Day 25: Interview Q&A prep: complexity, trade-offs, correctness proof.`,
    `Day 26: Solve 5 short mixed drills focusing on speed.`,
    `Day 27: Full revision of must-solve list progress.`,
    `Day 28: Final mock interview on ${topic} with post-analysis.`,
    `Day 29: Fix weakest sub-pattern based on error log.`,
    `Day 30: Final consolidation: summarize learnings and schedule monthly maintenance.`
  ].join('\n');
};

const buildExpectedInterviewAnswers = (topic) => {
  return [
    `Q1: What is ${topic} and when should it be used?`,
    `A1: ${topic} is best used when the problem structure and constraints align with its core pattern and invariant.`,
    '',
    'Q2: How do you move from brute force to optimized?',
    'A2: Identify repeated work, reduce redundant scans, and use suitable structures while preserving correctness.',
    '',
    'Q3: What edge cases do you check first?',
    'A3: Empty input, smallest valid input, duplicate-heavy cases, monotonic/sorted cases, and extreme limits.',
    '',
    `Q4: How do you prove ${topic} solution correctness?`,
    'A4: By defining an invariant, showing maintenance at each step, and proving termination yields the required result.',
    '',
    'Q5: What is a common coding pitfall?',
    'A5: Incorrect boundary updates and transition order, which can break invariants silently.',
    '',
    'Q6: How do you explain complexity in interviews?',
    'A6: Break down operation counts and data-structure costs, then state total time and auxiliary space clearly.',
    '',
    'Q7: How do you adapt if constraints increase sharply?',
    'A7: Re-evaluate bottleneck operations and switch to scalable methods with explicit trade-off reasoning.',
    '',
    'Q8: What do you do after a failed hidden test case?',
    'A8: Reproduce minimal failing case, trace state transitions, and patch logic without regressing prior cases.',
    '',
    'Q9: Readability or performance first?',
    'A9: Start with readable correctness, then optimize critical paths if constraints demand.',
    '',
    `Q10: One-line summary for ${topic}?`,
    `A10: Choose the right ${topic} pattern, preserve invariant, and validate complexity plus edge-case safety.`
  ].join('\n');
};

const createDetailedNoteContent = (topic) => {
  const overview = TOPIC_OVERVIEWS[topic] || `${topic} interview fundamentals.`;
  const pseudocode = TOPIC_PSEUDOCODE[topic] || '1. Define problem state\n2. Apply suitable strategy\n3. Track invariants\n4. Return answer';
  const javaExample = TOPIC_JAVA_EXAMPLES[topic] || `class ${topic.replace(/[^A-Za-z0-9]/g, '')}Demo {\n  int solve(int[] nums) {\n    return nums.length;\n  }\n}`;
  const mustSolve = MUST_SOLVE_QUESTIONS[topic] || [];
  const memorySheet = MEMORY_SHEETS[topic] || [];
  const thirtyDayPlan = buildThirtyDaySchedule(topic);
  const expectedAnswers = buildExpectedInterviewAnswers(topic);

  return `Concept explanation:
Overview:
${overview}

Why this topic matters in placements:
- Frequently tested in coding rounds and interviews.
- Helps interviewers evaluate problem decomposition and optimization skill.
- Appears as a building block in combined multi-pattern questions.

Core theory and mental model:
- Identify what state changes each step and what must remain invariant.
- Keep transitions explicit: current state -> next state.
- Prefer clear correctness reasoning before micro-optimizations.
- Separate idea, proof sketch, and implementation details.

Interview framework (before coding):
1. Confirm constraints and expected output.
2. Explain brute-force baseline.
3. Present optimized strategy with invariant.
4. Discuss edge cases and failure modes.
5. State complexity and trade-offs.

Important patterns within ${topic}:
- Template selection and adaptation
- Boundary/index/pointer safety
- Space-time trade-off decisions
- Dry-run based correctness verification

Common mistakes to avoid:
- Missing empty/minimal input cases
- Updating state in wrong order
- Breaking loop/recursion invariant
- Overlooking overflow/depth constraints

Complexity checklist:
- Time complexity in best/avg/worst cases
- Auxiliary space usage
- Can we reduce repeated work?
- Is in-place processing acceptable?

7-day focused practice plan:
- Day 1: Learn the base template and solve 2 easy questions.
- Day 2: Solve 3 medium questions under timer.
- Day 3: Re-solve previous set without reference.
- Day 4: Attempt 1 difficult variant and write notes.
- Day 5: Mixed-topic set where ${topic} appears as sub-pattern.
- Day 6: Mock interview discussion + code walkthrough.
- Day 7: Revision and error-log consolidation.

Mini interview Q&A:
Q1: Why is this solution correct?
A1: The invariant holds after each update and guarantees all valid states are considered.

Q2: What edge cases did you handle?
A2: Empty input, single element/node, repeated values, extremes, and invalid transitions.

Q3: Can it be improved?
A3: Improve by reducing repeated scans, caching intermediate data, or replacing heavy structures.

Q4: Why this complexity is acceptable?
A4: It aligns with standard optimal bounds for this problem category in interviews.

Problem taxonomy for ${topic}:
- Recognition problems: map prompt to known templates quickly.
- Construction problems: generate output while maintaining constraints.
- Optimization problems: maximize/minimize target metric efficiently.
- Validation problems: verify state/structure correctness.
- Counting problems: compute number of valid outcomes or paths.

Deep-dive checklist (advanced understanding):
- Can this approach be derived from brute force incrementally?
- Can correctness be justified using an invariant?
- Can you identify counter-examples for wrong approaches?
- Can the same idea scale for larger constraints?
- Can you switch between iterative and recursive forms?

Optimization playbook:
- Eliminate repeated scans with cached state.
- Replace expensive loops using pattern-specific techniques.
- Reduce auxiliary memory where possible.
- Maintain stable update order for correctness.
- Re-check if complexity meets interview expectations.

Debugging workflow in interview settings:
1. Dry-run smallest valid input first.
2. Trace key variables after each state transition.
3. Verify boundary and stop conditions.
4. Test one adversarial edge case.
5. Re-state complexity post-fix.

Communication template while coding:
- "Baseline approach is ..."
- "Invariant maintained is ..."
- "Transition step does ... because ..."
- "Edge case handling includes ..."
- "Final complexity and trade-offs are ..."

Self-assessment rubric (1-5 score):
- Pattern recognition
- Correctness explanation
- Edge-case robustness
- Complexity confidence
- Implementation reliability

Any score below 3 indicates need for focused revision and re-solving without old references.

15 must-solve question names:
${mustSolve.map((question, index) => `${index + 1}. ${question}`).join('\n')}

Topic-wise formula/memory sheet:
${memorySheet.map((line) => `- ${line}`).join('\n')}

30-day schedule:
${thirtyDayPlan}

Expected interview answers (top 10):
${expectedAnswers}

Pseudocode:
${pseudocode}

Java example:
${javaExample}

Revision cheat sheet:
- Summary: ${topic} requires selecting the right pattern and preserving invariant.
- Trigger words: constraints, optimize, edge case, invariant, dry run.
- Final reminder: explain approach first, then code, then verify with 2 manual test cases.`;
};

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
  content: createDetailedNoteContent(topic),
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
    const note = noteEntry(topic);
    await Note.updateOne(
      { title: `${topic} Notes`, studentId: null },
      {
        $set: { content: note.content, topics: note.topics, visibility: note.visibility },
        $setOnInsert: { studentId: note.studentId, title: note.title, companies: note.companies }
      },
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
