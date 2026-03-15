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
  Arrays: 'Question pattern: Two Sum\n1. Create empty map valueToIndex\n2. For each index i in nums:\n   a. need = target - nums[i]\n   b. If need exists in map, return [map[need], i]\n   c. Store nums[i] -> i in map\n3. If no pair found, return [-1, -1]',
  'Linked Lists': 'Question pattern: Reverse Linked List\n1. prev = null, curr = head\n2. While curr is not null:\n   a. next = curr.next\n   b. curr.next = prev\n   c. prev = curr\n   d. curr = next\n3. Return prev as new head',
  Stacks: 'Question pattern: Valid Parentheses\n1. Initialize empty stack\n2. For each char c:\n   a. If opening bracket, push expected closing bracket\n   b. Else if stack empty or pop != c, return false\n3. Return stack is empty',
  Queues: 'Question pattern: Implement Queue using Stacks\n1. push(x): push x to inStack\n2. pop(): if outStack empty, move all from inStack to outStack, then pop\n3. peek(): same transfer rule, then return top of outStack\n4. empty(): return inStack and outStack are both empty',
  Trees: 'Question pattern: Maximum Depth of Binary Tree\n1. If root is null, return 0\n2. leftDepth = depth(root.left)\n3. rightDepth = depth(root.right)\n4. Return 1 + max(leftDepth, rightDepth)',
  'Binary Search Trees': 'Question pattern: Validate BST\n1. DFS(node, low, high)\n2. If node is null, return true\n3. If node.val <= low or node.val >= high, return false\n4. Return DFS(left, low, node.val) and DFS(right, node.val, high)',
  Heaps: 'Question pattern: Kth Largest Element in Array\n1. Create minHeap\n2. For each number x:\n   a. Push x\n   b. If heap size > k, pop smallest\n3. Heap top is kth largest, return top',
  Graphs: 'Question pattern: Number of Islands\n1. Iterate all grid cells\n2. When cell is unvisited land:\n   a. islands++\n   b. Run DFS/BFS to mark connected land visited\n3. Return islands',
  'Dynamic Programming': 'Question pattern: Coin Change\n1. dp[0] = 0, dp[1..amount] = INF\n2. For a from 1 to amount:\n   a. For each coin c:\n      if a-c >= 0 then dp[a] = min(dp[a], dp[a-c] + 1)\n3. If dp[amount] is INF return -1 else return dp[amount]',
  'Greedy Algorithms': 'Question pattern: Jump Game II\n1. jumps=0, currEnd=0, farthest=0\n2. For i from 0 to n-2:\n   a. farthest = max(farthest, i + nums[i])\n   b. If i == currEnd: jumps++, currEnd = farthest\n3. Return jumps',
  Recursion: 'Question pattern: Pow(x, n)\n1. If n == 0 return 1\n2. half = pow(x, n/2)\n3. If n is even return half*half\n4. If n > 0 return half*half*x else return (half*half)/x',
  Backtracking: 'Question pattern: Subsets\n1. backtrack(index, path)\n2. Add copy(path) to answer\n3. For i from index to n-1:\n   a. Add nums[i] to path\n   b. backtrack(i+1, path)\n   c. Remove last element from path',
  Trie: 'Question pattern: Implement Trie\n1. insert(word): walk characters, create missing child nodes, mark end=true\n2. search(word): walk characters, return true only if end=true at last char\n3. startsWith(prefix): walk characters, return false on missing child else true',
  'Segment Trees': 'Question pattern: Range Sum Query - Mutable\n1. Build tree(node, l, r) storing sum for interval [l,r]\n2. Query(node, l, r, ql, qr) using no/partial/full overlap\n3. Update(node, l, r, idx, val) and recompute parent sums\n4. Return query result for requested range',
  'Bit Manipulation': 'Question pattern: Single Number\n1. ans = 0\n2. For each value x in nums: ans = ans XOR x\n3. Return ans (pairs cancel out: x XOR x = 0)',
  'Sliding Window': 'Question pattern: Longest Substring Without Repeating Characters\n1. left=0, best=0, lastSeen map\n2. For right from 0..n-1:\n   a. If s[right] seen at >= left, left = lastSeen[s[right]] + 1\n   b. Update lastSeen[s[right]] = right\n   c. best = max(best, right-left+1)\n3. Return best',
  'Two Pointer Technique': 'Question pattern: Two Sum II (sorted array)\n1. left=0, right=n-1\n2. While left < right:\n   a. sum = a[left] + a[right]\n   b. If sum == target return [left+1, right+1]\n   c. If sum < target left++ else right--\n3. Return [-1, -1] if no pair exists',
  'Binary Search': 'Question pattern: Search Insert Position\n1. low=0, high=n-1\n2. While low <= high:\n   a. mid = low + (high-low)/2\n   b. If nums[mid] == target return mid\n   c. If nums[mid] < target low = mid+1 else high = mid-1\n3. Return low as insertion index',
  'System Design Basics': 'Question pattern: Design URL Shortener\n1. Accept longURL and validate input\n2. Generate unique short key (base62 or hash+collision check)\n3. Store mapping shortKey -> longURL in DB/cache\n4. Redirect flow: lookup shortKey and return 302 to longURL\n5. Add rate limiting, analytics, and expiration policy',
  'Concurrency Basics': 'Question pattern: Producer Consumer\n1. Shared bounded queue + mutex + notFull + notEmpty conditions\n2. Producer: wait while queue full, push item, signal notEmpty\n3. Consumer: wait while queue empty, pop item, signal notFull\n4. Always lock around queue operations; unlock in finally block'
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

const TOPIC_USE_CASES = {
  Arrays: ['Range queries with prefix/suffix preprocessing', 'Index-based simulation and in-place transforms', 'Subarray optimization with hash/prefix techniques'],
  'Linked Lists': ['Pointer rewiring problems (reverse, reorder, merge)', 'Fast/slow pointer detection (cycle, middle)', 'Constant-space node manipulations'],
  Stacks: ['Balanced symbols and nested expression parsing', 'Monotonic stack for next greater/smaller', 'Undo-style and last-in-first-out state handling'],
  Queues: ['BFS and level-wise traversal', 'Scheduling and rate-limited processing', 'Sliding window with deque optimization'],
  Trees: ['Hierarchy traversal and subtree aggregation', 'Path sum and ancestor queries', 'Recursive decomposition into left/right subproblems'],
  'Binary Search Trees': ['Ordered search and range filtering', 'Kth element via inorder traversal', 'Successor/predecessor style operations'],
  Heaps: ['Top-k selection in streaming data', 'Dynamic priority scheduling', 'Repeated extract-min/max workflows'],
  Graphs: ['Connectivity and component detection', 'Dependency ordering and cycle checks', 'Shortest path in weighted/unweighted models'],
  'Dynamic Programming': ['Optimal substructure and overlapping subproblems', 'Counting ways/paths under constraints', 'Decision optimization with state transitions'],
  'Greedy Algorithms': ['Interval scheduling and coverage', 'Locally optimal pick under proofable invariants', 'Resource assignment with sorted priorities'],
  Recursion: ['Divide into smaller identical subproblems', 'Tree/graph DFS style traversals', 'Backtracking-style state exploration'],
  Backtracking: ['Generate all valid combinations/permutations', 'Constraint satisfaction search', 'Decision tree with prune and rollback'],
  Trie: ['Prefix matching and autocomplete', 'Dictionary lookup and multi-word search', 'String set operations with common prefixes'],
  'Segment Trees': ['Range query + point/range updates', 'Online query/update mixes', 'Custom aggregate functions over intervals'],
  'Bit Manipulation': ['Masking state representation', 'Power/parity/uniqueness checks', 'Subset and XOR based optimizations'],
  'Sliding Window': ['Substring/subarray with contiguous constraints', 'Variable-size window validity problems', 'Fixed-size aggregate window calculations'],
  'Two Pointer Technique': ['Pair sum and sorted array constraints', 'In-place partition/compaction operations', 'Window-like shrinking/expanding with ordered movement'],
  'Binary Search': ['Sorted lookup and boundary search', 'Search on answer with monotonic predicate', 'Minimum/maximum feasible value problems'],
  'System Design Basics': ['Scalable read/write service decomposition', 'Caching and data partitioning choices', 'Reliability and observability planning'],
  'Concurrency Basics': ['Thread-safe shared state updates', 'Producer-consumer coordination', 'Deadlock/race avoidance with synchronization']
};

const TOPIC_EDGE_CASES = {
  Arrays: ['Empty array, single element, all equal values', 'Negative-heavy and overflow-prone sums', 'Index boundaries at 0 and n-1'],
  'Linked Lists': ['Null head and single-node list', 'Cycle presence and tail boundary rewiring', 'Losing next pointer during mutation'],
  Stacks: ['Unexpected closing token early', 'Duplicate values for monotonic variants', 'Leftover stack state after scan'],
  Queues: ['Queue exhaustion conditions', 'Level-size bookkeeping errors in BFS', 'Repeated node enqueue without visited checks'],
  Trees: ['Null root and skewed tree depth', 'Leaf-only and single-branch structures', 'Path sums with negative values'],
  'Binary Search Trees': ['Duplicate key handling policy', 'Delete root with two children', 'Boundary values near INT limits'],
  Heaps: ['k larger than input size', 'Equal priorities with tie behavior', 'Heap growth without size cap'],
  Graphs: ['Disconnected components', 'Self-loops and multi-edges', 'Directed vs undirected traversal assumptions'],
  'Dynamic Programming': ['Incorrect base initialization', 'Transition order causing stale states', 'State definition not covering all constraints'],
  'Greedy Algorithms': ['Greedy choice invalid without proof', 'Tie-breaking impacts final optimality', 'Local optimum not global optimum'],
  Recursion: ['Missing base case termination', 'Stack overflow on deep recursion', 'Incorrect combination of recursive returns'],
  Backtracking: ['Forgetting to undo state', 'Late pruning causing TLE', 'Duplicate generation without canonical ordering'],
  Trie: ['Case/charset normalization mismatch', 'Prefix present but word-end missing', 'Null child traversal checks'],
  'Segment Trees': ['Partial overlap merge errors', 'Update propagation bug to parent nodes', 'Range boundaries off by one'],
  'Bit Manipulation': ['Signed shift pitfalls', 'Operator precedence mistakes', 'Mask width mismatch with integer type'],
  'Sliding Window': ['Shrinking condition too early/late', 'Frequency map underflow', 'Not updating answer at valid window states'],
  'Two Pointer Technique': ['Pointer movement in wrong direction', 'Duplicate handling in 3Sum/4Sum', 'Infinite loop when pointers do not progress'],
  'Binary Search': ['Mid update causing infinite loop', 'Incorrect lower/upper bound condition', 'Predicate not truly monotonic'],
  'System Design Basics': ['Ignoring capacity estimates', 'Single point of failure in architecture', 'No cache invalidation strategy'],
  'Concurrency Basics': ['Race conditions on shared mutable state', 'Deadlock from inconsistent lock order', 'Liveness/starvation under heavy contention']
};

const TOPIC_INTERVIEW_STRATEGY = {
  Arrays: 'Lead with brute force O(n^2), then shift to prefix/hash/two-pointer optimization depending on constraint shape.',
  'Linked Lists': 'Draw node transitions first, verbalize pointer invariants, and mention O(1) extra-space rewiring whenever possible.',
  Stacks: 'State stack invariant before coding and explain exactly why each pop preserves correctness.',
  Queues: 'Explain processing order guarantee (FIFO) and how it maps to shortest-level traversal or event simulation.',
  Trees: 'Declare DFS/BFS choice with reason, then define return meaning for each recursive call.',
  'Binary Search Trees': 'Use BST ordering explicitly to prune search space and justify O(h) behavior.',
  Heaps: 'Call out why heap is better than full sorting for top-k or streaming constraints.',
  Graphs: 'Start with graph representation, then choose BFS/DFS/Topo based on reachability, cycle, or ordering goal.',
  'Dynamic Programming': 'Define state and transition in one sentence each before writing any loop or recursion.',
  'Greedy Algorithms': 'Mention greedy criterion and provide a brief proof sketch (exchange argument/invariant).',
  Recursion: 'State base case first, then recursive relation, then complexity from branching and depth.',
  Backtracking: 'Use choose-explore-unchoose narration and explicitly mention pruning conditions.',
  Trie: 'Describe node meaning (children + terminal flag) and complexity as O(length of word/prefix).',
  'Segment Trees': 'Clarify overlap cases (no, partial, full) and show how merge function drives correctness.',
  'Bit Manipulation': 'Translate problem statement into bit rule first, then apply masks with tested examples.',
  'Sliding Window': 'Define window validity condition and when left pointer must move to restore invariants.',
  'Two Pointer Technique': 'Explain why pointer movement is monotonic and cannot skip valid answers under sorted/ordered assumptions.',
  'Binary Search': 'Declare invariant and boundary objective (first true/last false) before loop implementation.',
  'System Design Basics': 'Start with requirements + scale estimates, then APIs/data model/cache/reliability trade-offs.',
  'Concurrency Basics': 'Identify shared state, synchronization primitive, and liveness guarantees before implementation details.'
};

const TOPIC_DEEP_DIVE = {
  Arrays: {
    focus: 'Index-based reasoning, prefix/suffix transformations, and in-place mutation safety.',
    variants: ['Prefix sum and difference arrays', 'Kadane-style running optimum', 'In-place rotation/partition templates'],
    proof: 'Show index invariant and that each element contributes correctly once per transition.',
    tuning: 'Precompute reusable aggregates and avoid nested scans when constraints are large.'
  },
  'Linked Lists': {
    focus: 'Pointer wiring correctness with minimal extra memory.',
    variants: ['Reverse full/partial list', 'Fast-slow cycle and middle finding', 'Merge/split/reorder operations'],
    proof: 'Prove no node is lost by storing next pointer before rewiring.',
    tuning: 'Use dummy nodes to simplify head-edge updates and reduce branch complexity.'
  },
  Stacks: {
    focus: 'Maintaining LIFO invariants and monotonic order constraints.',
    variants: ['Balanced delimiters', 'Monotonic stack for next greater/smaller', 'Expression evaluation and decoding'],
    proof: 'Argue each push/pop preserves stack invariant and bounds total pops to O(n).',
    tuning: 'Store indices instead of values when position impacts output construction.'
  },
  Queues: {
    focus: 'FIFO processing guarantees and level-ordered traversal logic.',
    variants: ['Classic BFS', 'Deque-based monotonic window', 'Task/process simulation queues'],
    proof: 'Show enqueue/dequeue order matches required temporal or distance ordering.',
    tuning: 'Track current level size once per layer to avoid repeated queue length checks.'
  },
  Trees: {
    focus: 'Recursive decomposition of subtree answers and traversal strategy selection.',
    variants: ['DFS preorder/inorder/postorder', 'BFS level traversal', 'Path and subtree aggregate problems'],
    proof: 'Use induction on subtree size with base case null/leaf correctness.',
    tuning: 'Return compound state tuples from recursion to avoid repeated traversals.'
  },
  'Binary Search Trees': {
    focus: 'Leveraging sorted structural property: left < root < right.',
    variants: ['Search/insert/delete', 'Kth element via inorder', 'Range pruning queries'],
    proof: 'Show branch pruning is safe because BST ordering excludes impossible regions.',
    tuning: 'Prefer iterative traversal for long skewed trees to reduce call-stack risk.'
  },
  Heaps: {
    focus: 'Priority extraction and bounded top-k maintenance.',
    variants: ['Min-heap for k largest', 'Max-heap for repeated best pick', 'Two-heaps median maintenance'],
    proof: 'Demonstrate root always represents current extreme under heap order property.',
    tuning: 'Keep heap size bounded when only top-k is required to reduce memory/time.'
  },
  Graphs: {
    focus: 'Modeling relationships and traversing with visited-state discipline.',
    variants: ['Connected components', 'Cycle detection', 'Topological sorting and shortest paths'],
    proof: 'Prove each vertex/edge is processed under clear visitation invariant.',
    tuning: 'Use adjacency lists for sparse graphs and avoid repeated neighbor scans.'
  },
  'Dynamic Programming': {
    focus: 'State design, recurrence transitions, and dependency order.',
    variants: ['1D/2D tabulation', 'Memoized recursion', 'Knapsack/LIS/path-count families'],
    proof: 'Show transition uses already-correct smaller states and covers all possibilities.',
    tuning: 'Apply rolling arrays/state compression when transition depends on limited history.'
  },
  'Greedy Algorithms': {
    focus: 'Locally optimal decision rules with global correctness argument.',
    variants: ['Interval scheduling', 'Resource assignment', 'Minimum step/cover constructions'],
    proof: 'Provide exchange argument or invariant showing no better solution is excluded.',
    tuning: 'Sort once by greedy key and keep decision loop strictly linear thereafter.'
  },
  Recursion: {
    focus: 'Problem reduction into self-similar subproblems with clear base cases.',
    variants: ['Divide and conquer', 'Tree traversals', 'Recursive enumeration'],
    proof: 'Termination + correctness by induction on input size/depth.',
    tuning: 'Memoize overlapping branches and convert to iterative when stack depth is unsafe.'
  },
  Backtracking: {
    focus: 'Search tree exploration with choose-explore-unchoose discipline.',
    variants: ['Permutations/combinations/subsets', 'Constraint satisfaction', 'Board/path search'],
    proof: 'Every valid solution path is visited once while invalid prefixes are pruned.',
    tuning: 'Prune early with feasibility checks and canonical ordering to avoid duplicates.'
  },
  Trie: {
    focus: 'Prefix-indexed string storage with character-level branching.',
    variants: ['Insert/search/prefix check', 'Autocomplete suggestions', 'Dictionary + wildcard search'],
    proof: 'Character path uniquely represents prefix; terminal flag determines word completion.',
    tuning: 'Use compact child representation for larger alphabets to save memory.'
  },
  'Segment Trees': {
    focus: 'Range decomposition and efficient query/update propagation.',
    variants: ['Range sum/min/max', 'Point update', 'Lazy propagation for range update'],
    proof: 'Each node stores correct aggregate for its interval; merge correctness composes globally.',
    tuning: 'Avoid rebuilding; propagate only affected branches and lazy tags as needed.'
  },
  'Bit Manipulation': {
    focus: 'Binary-state operations for compact and fast computation.',
    variants: ['Mask set/clear/toggle', 'XOR uniqueness tricks', 'Bit-count and subset encoding'],
    proof: 'Use truth-table reasoning for each operator and mask transformation.',
    tuning: 'Prefer constant-time bit operations over loops where transformation is direct.'
  },
  'Sliding Window': {
    focus: 'Maintaining contiguous window validity while scanning once.',
    variants: ['Fixed-size windows', 'Variable-size with constraints', 'Frequency-map window control'],
    proof: 'Window invariant is restored after each adjustment before scoring answer.',
    tuning: 'Update counts incrementally instead of recomputing window properties.'
  },
  'Two Pointer Technique': {
    focus: 'Monotonic pointer movement to discard impossible states efficiently.',
    variants: ['Opposite-direction sum search', 'Fast/slow compaction', 'Deduplicated multi-sum families'],
    proof: 'Each pointer move removes only infeasible candidates and guarantees progress.',
    tuning: 'Sort once, skip duplicates carefully, and ensure at least one pointer moves each loop.'
  },
  'Binary Search': {
    focus: 'Boundary narrowing on sorted/monotonic search spaces.',
    variants: ['Exact match', 'Lower/upper bound', 'Binary search on answer predicate'],
    proof: 'Maintain loop invariant that target boundary remains within [low, high].',
    tuning: 'Use mid = low + (high-low)/2 and consistent boundary update semantics.'
  },
  'System Design Basics': {
    focus: 'Requirement-driven architecture with explicit scale and reliability trade-offs.',
    variants: ['Read-heavy cache-first systems', 'Write-heavy queued pipelines', 'Event-driven microservice decomposition'],
    proof: 'Justify each component by bottleneck addressed and failure mode handled.',
    tuning: 'Add partitioning, caching, and asynchronous flows only where measurable need exists.'
  },
  'Concurrency Basics': {
    focus: 'Safe parallel execution with synchronization and liveness guarantees.',
    variants: ['Mutex/semaphore coordination', 'Producer-consumer queues', 'Read-write lock strategies'],
    proof: 'Demonstrate race freedom, deadlock avoidance, and forward progress assumptions.',
    tuning: 'Minimize lock scope and contention hotspots; prefer immutability where practical.'
  }
};

const TOPIC_CONCEPT_OVERRIDES = {
  'Two Pointer Technique': (overview, memorySheet) => `Overview:
${overview}

What Two Pointer Technique really means:
- You maintain two moving indices (left/right, slow/fast, read/write) over ordered data.
- Each pointer move must be justified by a monotonic rule so you never skip valid answers.
- The main goal is reducing O(n^2) pair/window checks to O(n) or O(n log n).

When to use Two Pointers:
- Pair constraints in sorted arrays (sum, difference, closest value).
- In-place array transformations (remove duplicates, move zeros, partition).
- String/palindrome checks from both ends.
- Merge-like linear scans of two sorted sources.

Recognition signals in interview questions:
- "sorted array" + "find pair/triplet" conditions.
- Need linear-time optimization from brute-force nested loops.
- Problem allows directional elimination (if value too small move left, if too large move right).

Core pointer patterns:
1. Opposite-direction pointers:
- left=0, right=n-1, move one pointer each iteration by comparison with target.
2. Same-direction fast/slow pointers:
- fast explores input, slow writes/maintains valid compacted region.
3. Sliding-boundary pointer pair:
- right expands candidate region, left shrinks to restore validity.

Correctness invariant template:
- Invariant: all eliminated states cannot produce a better/valid answer.
- Maintenance: each pointer move strictly removes only impossible states.
- Termination: when pointers cross (or fast ends), all feasible states were considered.

Complexity targets:
- Typical time: O(n) after sorting, or O(n log n) including sorting.
- Space: O(1) auxiliary for in-place pointer scans.

Topic-specific edge cases:
- Duplicate values causing repeated results (3Sum/4Sum dedup loops required).
- Integer overflow while computing sums near limits.
- Infinite loops when pointer does not move in some branch.
- Invalid boundary checks (left < right vs left <= right confusion).

Common mistakes:
- Moving wrong pointer for a comparison outcome.
- Forgetting to sort when algorithm assumes ordering.
- Returning early before checking duplicate-adjusted positions.
- Not updating answer before pointer shift in max/min optimization variants.

Interview walkthrough script:
- "Brute force is O(n^2). Because input is sorted (or can be sorted), I can use two pointers."
- "If sum is smaller than target, I must increase left; if larger, decrease right."
- "This is safe because the eliminated side cannot satisfy the target anymore."
- "Complexity becomes O(n) scan after sorting, with O(1) extra space."

Practice roadmap inside this topic:
- Level 1: Two Sum II, Valid Palindrome, Move Zeroes.
- Level 2: Container With Most Water, 3Sum, Remove Duplicates from Sorted Array.
- Level 3: 4Sum, Trapping Rain Water, partition-style advanced variants.

Advanced variants and extensions:
- k-Sum family: reduce k-Sum to (k-1)-Sum recursively with two-pointer base.
- Closest-value optimization: track minimum absolute difference while moving pointers.
- Stable in-place partitioning: combine read/write pointer with local swap discipline.
- Hybrid techniques: sort + two pointers + hashing for dedup or membership checks.

Correctness proof checklist:
- Pointer movement always reduces search space.
- No eliminated pair can become valid later.
- Loop terminates because at least one pointer moves each iteration.
- Duplicate-skipping rules preserve completeness and uniqueness.

Debug checklist:
- Verify pointer updates in every branch.
- Log (left, right, sum) transitions on one failing input.
- Check dedup loops for boundary overrun.
- Re-test with all-equal values and strictly increasing values.

Formula and memory sheet:
${memorySheet.map((item) => `- ${item}`).join('\n')}`,

  'System Design Basics': (overview, memorySheet) => `Overview:
${overview}

What this topic is about:
- Designing reliable services under scale, latency, and availability constraints.
- Converting vague requirements into APIs, data models, and infrastructure choices.
- Explaining trade-offs instead of chasing a single "perfect" architecture.

Interview structure to follow:
1. Clarify requirements:
- Functional (what features?) and non-functional (QPS, latency, uptime, consistency).
2. Capacity estimation:
- Estimate traffic, storage, read/write ratio, and growth.
3. High-level design:
- Client -> Gateway -> Services -> Cache/Queue/DB/Blob store.
4. Data model and APIs:
- Primary entities, keys, indexes, API contracts.
5. Deep dive bottlenecks:
- Caching, partitioning, replication, failover, backpressure.
6. Reliability and observability:
- Retries, idempotency, rate limits, monitoring, alerting.

Core system components and when they matter:
- Load balancer: distribute requests and improve availability.
- Cache (Redis): reduce read latency and DB pressure.
- Message queue: absorb bursts and decouple producers/consumers.
- SQL/NoSQL: choose by query shape and consistency requirements.
- CDN/object storage: static assets and large file delivery.

Common trade-offs to articulate:
- Latency vs consistency.
- Simplicity vs flexibility.
- Cost vs performance.
- Read optimization vs write amplification.

Topic-specific edge cases:
- Cache stampede and stale reads.
- Hot partitions/skewed keys.
- Retry storms during partial outages.
- Duplicate requests without idempotency keys.

Common mistakes:
- Skipping requirement clarification.
- No capacity numbers at all.
- Choosing tools without workload justification.
- Ignoring failure modes and recovery path.

Interview answer template:
- "Given expected QPS and latency target, I split read/write paths."
- "I add cache-aside for hot reads and queue for asynchronous heavy tasks."
- "Data is partitioned by __ and replicated for high availability."
- "Failure handling includes retries with backoff, idempotency, and circuit breakers."

Advanced deep-dive points:
- Data consistency model: strong vs eventual and where each is acceptable.
- Partition strategy: key choice, skew management, and rebalancing approach.
- Write path safety: idempotency keys, deduplication, and at-least-once effects.
- Read path performance: cache hit strategy, invalidation policy, stale-read handling.
- Failure policy: timeout budgets, circuit breakers, fallback behavior, and recovery SLA.

System design review checklist:
- Does architecture survive one component failure?
- Are hot keys and uneven traffic explicitly handled?
- Can we observe failure quickly (logs/metrics/traces)?
- Is there a clear migration path when scale 10x increases?
- Are security and abuse protections covered (auth, rate limit, audit)?

Formula and memory sheet:
${memorySheet.map((item) => `- ${item}`).join('\n')}`
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

const buildExpectedInterviewQuestions = (topic) => {
  return [
    `1. What is ${topic} and when should you use it?`,
    '2. Which brute-force approach would you start with?',
    '3. How do you optimize the baseline approach?',
    '4. What invariant do you maintain for correctness?',
    '5. Which edge cases are most error-prone here?',
    '6. What is the time and space complexity, and why?',
    '7. What are common implementation mistakes in this topic?',
    '8. How would you test this approach quickly in an interview?',
    '9. What trade-offs exist between readability and performance?',
    `10. How would you adapt ${topic} if constraints become much larger?`
  ].join('\n');
};

const buildAdvancedPseudocodeSection = (topic, pseudocode, mustSolve) => {
  const selectedQuestions = (Array.isArray(mustSolve) && mustSolve.length > 0
    ? mustSolve
    : [`${topic} Core Interview Problem`, `${topic} Variant Problem`, `${topic} Optimization Problem`]).slice(0, 3);

  const buildSampleBlock = (questionName, codeBody) => {
    return `Problem Statement:
Write pseudocode for "${questionName}" from ${topic} and return the required output with optimized logic.

SampleInput1:
N and problem-specific input values
SampleOutput1:
Expected valid output for input 1
SampleInput2:
Another valid input with edge conditions
SampleOutput2:
Expected valid output for input 2

Pseudocode:
BEGIN
${codeBody}
END`;
  };

  const variantPseudocode = (questionName, index) => {
    const primary = `    READ input
    INITIALIZE state variables and helper structures
    FOR each required element/state transition
        APPLY ${topic} transition rule
        UPDATE answer candidate/invariant
    ENDFOR
    PRINT/RETURN final answer`;

    const robust = `    READ input and constraints
    IF input is empty THEN
        PRINT/RETURN base case answer
    ENDIF
    INITIALIZE pointers/index/state trackers
    WHILE/FOR transition loop is valid
        APPLY ${topic} rule and boundary checks
        UPDATE state and answer safely
    ENDLOOP
    PRINT/RETURN final optimized answer`;

    const optimized = `    READ input
    SET up optimized ${topic} structure (precompute/map/pointers)
    ITERATE through states once where possible
        MAINTAIN invariant after each transition
        CAPTURE best/required answer
    ENDITERATE
    HANDLE remaining edge condition if any
    PRINT/RETURN final answer`;

    if (index === 0) {
      return buildSampleBlock(questionName, primary);
    }

    if (index === 1) {
      return buildSampleBlock(questionName, robust);
    }

    return buildSampleBlock(questionName, optimized);
  };

  const variantTheory = (index) => {
    const lines = [
      [
        '- This is the canonical interview flow for the topic and is easiest to explain under time pressure.',
        '- State transition order is explicit, so correctness proof becomes straightforward.',
        '- Each step has a clear invariant check before the next update.',
        '- Time and space analysis can be derived directly from the loop/recursion structure.',
        '- This version is best for building baseline confidence and avoiding logic drift.'
      ],
      [
        '- This variant introduces extra boundary handling for tricky constraints and edge cases.',
        '- It focuses on robust updates when duplicates or special conditions appear.',
        '- The structure reduces failure probability in hidden test cases.',
        '- It trades a little readability for stronger safety in corner scenarios.',
        '- Use this when the problem includes additional conditional rules.'
      ],
      [
        '- This optimization variant removes redundant work and improves performance under large inputs.',
        '- Invariant-preserving transitions ensure optimization does not break correctness.',
        '- Data-structure choices are aligned with asymptotic improvement targets.',
        '- It is suitable when constraints force near-optimal complexity.',
        '- Use this variant after validating the baseline implementation.'
      ]
    ];

    return (lines[index] || lines[0]).join('\n');
  };

  const questionBlocks = selectedQuestions.map((questionName, index) => {
    return `Question name: ${questionName}\n${variantPseudocode(questionName, index)}\nTheory:\n${variantTheory(index)}`;
  }).join('\n\n');

  return `${questionBlocks}\n\nAdvanced pseudocode features:\n- Add explicit guard clauses for empty input and minimal input size.\n- Document invariant after each transition-heavy step.\n- Include one dry-run (normal case) and one adversarial dry-run.\n- Mention final time complexity and space complexity under the pseudocode.`;
};

const createDetailedNoteContent = (topic) => {
  const overview = TOPIC_OVERVIEWS[topic] || `${topic} interview fundamentals.`;
  const pseudocode = TOPIC_PSEUDOCODE[topic] || '1. Define problem state\n2. Apply suitable strategy\n3. Track invariants\n4. Return answer';
  const javaExample = TOPIC_JAVA_EXAMPLES[topic] || `class ${topic.replace(/[^A-Za-z0-9]/g, '')}Demo {\n  int solve(int[] nums) {\n    return nums.length;\n  }\n}`;
  const mustSolve = MUST_SOLVE_QUESTIONS[topic] || [];
  const thirtyDayPlan = buildThirtyDaySchedule(topic);
  const expectedQuestions = buildExpectedInterviewQuestions(topic);
  const memorySheet = MEMORY_SHEETS[topic] || [];
  const useCases = TOPIC_USE_CASES[topic] || ['Core interview pattern detection', 'Constraint-aware optimization', 'Correctness with invariant reasoning'];
  const edgeCases = TOPIC_EDGE_CASES[topic] || ['Empty input', 'Single-item input', 'Boundary condition handling'];
  const interviewStrategy = TOPIC_INTERVIEW_STRATEGY[topic] || `Start from baseline for ${topic}, optimize with invariant, then justify complexity and edge-case handling.`;
  const deepDive = TOPIC_DEEP_DIVE[topic] || {
    focus: `${topic} core patterns and correctness trade-offs.`,
    variants: ['Canonical template', 'Optimization variant', 'Edge-case aware variant'],
    proof: 'Define invariant and prove transition safety + termination.',
    tuning: 'Remove repeated work and choose efficient data structures.'
  };
  const javaExplanation = [
    '- Uses a standard interview-safe template for this topic.',
    '- Emphasizes clear state transitions and boundary checks.',
    '- Can be optimized further based on problem-specific constraints.'
  ].join('\n');
  const pseudocodeSection = buildAdvancedPseudocodeSection(topic, pseudocode, mustSolve);
  const conceptBody = TOPIC_CONCEPT_OVERRIDES[topic]
    ? TOPIC_CONCEPT_OVERRIDES[topic](overview, memorySheet)
    : `Why this topic matters:
- Frequently appears in online assessments and technical interviews.
- Acts as a foundation for mixed-pattern medium and hard questions.
- Helps demonstrate both problem solving and optimization thinking.

Mental model:
- Start by identifying what state must be tracked at each step.
- Define one invariant that remains true after every transition.
- Keep updates deterministic: old state -> transition -> new state.
- Validate the approach on a tiny dry-run before coding fully.

Topic deep dive:
- Focus: ${deepDive.focus}
- Variants:
${deepDive.variants.map((item) => `  - ${item}`).join('\n')}
- Proof mindset: ${deepDive.proof}
- Performance tuning: ${deepDive.tuning}

Best situations to apply ${topic}:
${useCases.map((item) => `- ${item}`).join('\n')}

Core ideas:
- Identify the invariant that must stay true.
- Update state in a safe and deterministic order.
- Validate with boundary and edge-case checks.

Important patterns inside ${topic}:
- Pattern recognition from problem constraints.
- Correct boundary/index/pointer movement.
- Reduction of repeated work via caching/precomputation.
- Choosing readable vs optimized implementation under constraints.

Common mistakes to avoid:
- Off-by-one and wrong loop/recursion stopping condition.
- Updating variables in the wrong order.
- Ignoring empty/minimum-size and duplicate-heavy inputs.
- Returning early without validating all required conditions.

Topic-specific edge cases:
${edgeCases.map((item) => `- ${item}`).join('\n')}

Formula and memory sheet:
${memorySheet.map((item) => `- ${item}`).join('\n')}

Complexity checklist:
- Best, average, and worst-case time complexity.
- Auxiliary space and recursion stack usage.
- Can repeated work be removed without breaking correctness?
- Is this complexity acceptable for given constraints?

Interview focus:
- Explain brute force first, then optimization.
- Justify correctness with invariant + termination.
- State final time and space complexity clearly.

Interview strategy for ${topic}:
${interviewStrategy}

How to explain in interviews (quick script):
- "My baseline is __ with complexity __."
- "I optimize using __ while preserving invariant __."
- "Edge cases handled: __, __, __."
- "Final complexity is __ time and __ space."

Advanced depth for ${topic}:
- Standard variants: counting, optimization (min/max), construction, validation.
- Proof angle: invariant + termination + no-missed-state argument.
- Optimization ladder: brute force -> pruning -> data-structure-assisted -> in-place refinement.
- Interview traps: hidden edge constraints, integer limits, duplicate handling, tie-breaking.
- Final check: run one normal case + one adversarial edge case before submission.`;

  return `Concept Explanation:
${conceptBody}

Pseudocode:
${pseudocodeSection}

Java Code with Explanation:
Java code:
${javaExample}

Explanation:
${javaExplanation}

Expected Interview Questions:
${expectedQuestions}

15 Must-Solve Question Names:
${mustSolve.map((question, index) => `${index + 1}. ${question}`).join('\n')}

30-Day Schedule:
${thirtyDayPlan}`;
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
