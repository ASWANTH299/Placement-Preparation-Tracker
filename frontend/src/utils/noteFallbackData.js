const NOTE_TOPICS = [
  'Arrays',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Sliding Window',
  'Two Pointer Technique',
  'Binary Search',
  'Recursion',
  'Backtracking',
  'Trees',
  'Binary Search Trees',
  'Heaps',
  'Graphs',
  'Dynamic Programming',
  'Greedy Algorithms',
  'Trie',
  'Segment Trees',
  'Bit Manipulation',
  'System Design Basics',
  'Concurrency Basics'
]

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const TOPIC_OVERVIEWS = {
  Arrays: 'Arrays store elements in contiguous memory, enabling O(1) index access. Most interview array problems test traversal strategy, prefix/suffix ideas, and in-place updates. Focus on handling boundaries, duplicates, and off-by-one errors.',
  'Linked Lists': 'Linked Lists are node-based structures useful for frequent insert/delete operations. Interview questions usually test pointer movement, fast/slow pointer patterns, and structural rewiring without losing references. Always draw node links before coding.',
  Stacks: 'Stacks follow LIFO order and are ideal for nested structure processing, monotonic patterns, and expression evaluation. Key interview skills include push/pop condition design and understanding what information should stay on the stack.',
  Queues: 'Queues follow FIFO order and are common in scheduling and level-by-level processing. Interview patterns include BFS traversal, sliding window with deque, and task simulation. Choose queue type based on needed operations at each end.',
  'Sliding Window': 'Sliding Window optimizes subarray/substring problems by maintaining a moving range instead of recomputing from scratch. Interview mastery comes from designing window expansion/contraction rules and correct frequency bookkeeping.',
  'Two Pointer Technique': 'Two pointers reduce complexity in sorted arrays, partitioning, and palindrome-style checks. The core skill is deciding pointer direction and movement condition. Always prove why each move is safe and complete.',
  'Binary Search': 'Binary Search is a divide-and-conquer method on sorted or monotonic search spaces. Interviews often extend it to answer-space search. Use safe mid computation, consistent loop invariant, and clear left/right update rules.',
  Recursion: 'Recursion solves problems by reducing them into smaller self-similar subproblems. Important interview skills are writing a clear base case, defining recursive choice, and reasoning about call stack depth and return flow.',
  Backtracking: 'Backtracking explores all valid possibilities and prunes invalid paths early. It is heavily used in subsets, permutations, and constraint problems. Keep state updates reversible and avoid shared mutable-state bugs.',
  Trees: 'Trees model hierarchical data. Interview tree problems center on DFS/BFS traversal, subtree property checks, and path aggregation. Identify whether solution needs preorder, inorder, postorder, or level order traversal.',
  'Binary Search Trees': 'BSTs maintain ordering: left < root < right. This enables fast lookup and range operations. Interview tasks include validation, kth element, predecessor/successor, and converting traversal logic into efficient queries.',
  Heaps: 'Heaps provide fast access to min/max elements and are useful for top-k, scheduling, and streaming median patterns. Interview focus: choose min-heap vs max-heap correctly and maintain heap size invariants.',
  Graphs: 'Graphs represent relationships among entities. Core interview patterns include BFS/DFS traversal, cycle detection, topological sorting, shortest path, and connected components. Track visited state carefully to prevent repeats.',
  'Dynamic Programming': 'DP solves overlapping subproblems with memoization or tabulation. Interview success depends on defining state, transition, and base cases clearly. Start from recurrence, then optimize space when possible.',
  'Greedy Algorithms': 'Greedy algorithms make locally optimal choices expecting global optimality. Interviews test whether you can justify correctness with exchange arguments or invariants. When proof is unclear, compare with DP alternatives.',
  Trie: 'Trie is a prefix tree for efficient string prefix operations. Typical interview use cases include autocomplete, dictionary matching, and word search. Represent children compactly and mark terminal nodes correctly.',
  'Segment Trees': 'Segment Trees support range queries and updates efficiently. Interview questions target sum/min/max over intervals with multiple updates. Learn tree build, query split logic, and point/range update propagation.',
  'Bit Manipulation': 'Bit Manipulation uses binary operations for compact and fast computations. Interview patterns include parity checks, subset masks, power-of-two logic, and XOR tricks. Practice operator precedence and masking carefully.',
  'System Design Basics': 'System Design Basics cover scalability, reliability, caching, databases, and API design trade-offs. Interview prep should include requirement clarification, component breakdown, bottleneck analysis, and evolution plan.',
  'Concurrency Basics': 'Concurrency Basics involve running tasks safely in parallel with synchronization control. Interview focus includes race conditions, deadlocks, thread-safe data sharing, and producer-consumer coordination.'
}

const TOPIC_PSEUDOCODE = {
  Arrays: '1. Iterate through array once\n2. Track required state (sum/index/frequency)\n3. Update answer when condition is satisfied\n4. Return final result',
  'Linked Lists': '1. Initialize pointer references\n2. Traverse while pointer is not null\n3. Rewire next pointers when needed\n4. Return modified head or computed value',
  Stacks: '1. For each element, evaluate stack condition\n2. Pop while condition is violated\n3. Push current element/index\n4. Build answer from stack state',
  Queues: '1. Initialize queue with starting nodes/items\n2. Process front element\n3. Push new valid neighbors/items\n4. Continue until queue becomes empty',
  'Sliding Window': '1. Expand right pointer and include current element\n2. While window invalid, shrink from left\n3. Update best answer for every valid window\n4. Return best metric',
  'Two Pointer Technique': '1. Initialize left and right pointers\n2. Evaluate pair/window condition\n3. Move one or both pointers based on rule\n4. Track best or target answer',
  'Binary Search': '1. Set low and high bounds\n2. Compute mid and evaluate predicate\n3. Move low/high while maintaining invariant\n4. Return boundary answer',
  Recursion: '1. Define base case\n2. Make recursive calls on smaller input\n3. Combine returned results\n4. Return final value',
  Backtracking: '1. Choose an option\n2. Recurse to next decision level\n3. Record solution on success\n4. Undo choice and try next option',
  Trees: '1. If node is null, return base value\n2. Recurse left and right subtrees\n3. Combine subtree results at current node\n4. Return aggregated answer',
  'Binary Search Trees': '1. Traverse based on key comparison\n2. Move left for smaller, right for larger\n3. Update answer when node satisfies condition\n4. Return located value/node',
  Heaps: '1. Push each candidate into heap\n2. If heap exceeds target size, pop root\n3. Continue processing all elements\n4. Read answer from heap top/content',
  Graphs: '1. Build adjacency representation\n2. Initialize visited set\n3. Traverse with BFS/DFS from each component\n4. Compute result during traversal',
  'Dynamic Programming': '1. Define DP state meaning\n2. Initialize base states\n3. Fill transitions in valid order\n4. Return target state value',
  'Greedy Algorithms': '1. Sort or prioritize by greedy criterion\n2. Iterate and pick best immediate choice\n3. Maintain feasibility constraints\n4. Return accumulated optimal construction',
  Trie: '1. Insert words character by character\n2. Create child node when missing\n3. Mark end-of-word flag\n4. Query by traversing prefix path',
  'Segment Trees': '1. Build tree over input range\n2. For query, split by overlap type\n3. Combine left and right child answers\n4. For update, propagate changes upward',
  'Bit Manipulation': '1. Convert rule into bit operation\n2. Apply mask/shift/xor/and/or\n3. Track transformed value\n4. Return computed result',
  'System Design Basics': '1. Clarify requirements and scale\n2. Design high-level components\n3. Choose data model and APIs\n4. Evaluate bottlenecks and trade-offs',
  'Concurrency Basics': '1. Identify shared mutable state\n2. Guard critical sections with synchronization\n3. Use safe communication primitives\n4. Verify absence of race/deadlock scenarios'
}

const TOPIC_JAVA_EXAMPLES = {
  Arrays: `class ArraysDemo {\n  int maxSum(int[] nums) {\n    int best = Integer.MIN_VALUE, current = 0;\n    for (int value : nums) {\n      current = Math.max(value, current + value);\n      best = Math.max(best, current);\n    }\n    return best;\n  }\n}`,
  'Linked Lists': `class LinkedListsDemo {\n  static class Node { int val; Node next; Node(int v) { val = v; } }\n  Node reverse(Node head) {\n    Node prev = null, curr = head;\n    while (curr != null) {\n      Node next = curr.next;\n      curr.next = prev;\n      prev = curr;\n      curr = next;\n    }\n    return prev;\n  }\n}`,
  Stacks: `class StacksDemo {\n  boolean isValid(String s) {\n    java.util.Deque<Character> st = new java.util.ArrayDeque<>();\n    for (char c : s.toCharArray()) {\n      if (c == '(') st.push(')');\n      else if (c == '[') st.push(']');\n      else if (c == '{') st.push('}');\n      else if (st.isEmpty() || st.pop() != c) return false;\n    }\n    return st.isEmpty();\n  }\n}`,
  Queues: `class QueuesDemo {\n  int[] bfsOrder(java.util.List<java.util.List<Integer>> g, int start) {\n    java.util.Queue<Integer> q = new java.util.ArrayDeque<>();\n    java.util.List<Integer> order = new java.util.ArrayList<>();\n    boolean[] seen = new boolean[g.size()];\n    q.offer(start);\n    seen[start] = true;\n    while (!q.isEmpty()) {\n      int node = q.poll();\n      order.add(node);\n      for (int nxt : g.get(node)) if (!seen[nxt]) { seen[nxt] = true; q.offer(nxt); }\n    }\n    return order.stream().mapToInt(Integer::intValue).toArray();\n  }\n}`,
  'Sliding Window': `class SlidingWindowDemo {\n  int longestUnique(String s) {\n    int[] idx = new int[128];\n    java.util.Arrays.fill(idx, -1);\n    int left = 0, best = 0;\n    for (int right = 0; right < s.length(); right++) {\n      char c = s.charAt(right);\n      if (idx[c] >= left) left = idx[c] + 1;\n      idx[c] = right;\n      best = Math.max(best, right - left + 1);\n    }\n    return best;\n  }\n}`,
  'Two Pointer Technique': `class TwoPointerTechniqueDemo {\n  boolean hasPair(int[] nums, int target) {\n    int left = 0, right = nums.length - 1;\n    while (left < right) {\n      int sum = nums[left] + nums[right];\n      if (sum == target) return true;\n      if (sum < target) left++; else right--;\n    }\n    return false;\n  }\n}`,
  'Binary Search': `class BinarySearchDemo {\n  int search(int[] nums, int target) {\n    int low = 0, high = nums.length - 1;\n    while (low <= high) {\n      int mid = low + (high - low) / 2;\n      if (nums[mid] == target) return mid;\n      if (nums[mid] < target) low = mid + 1;\n      else high = mid - 1;\n    }\n    return -1;\n  }\n}`,
  Recursion: `class RecursionDemo {\n  int factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n  }\n}`,
  Backtracking: `class BacktrackingDemo {\n  java.util.List<java.util.List<Integer>> subsets(int[] nums) {\n    java.util.List<java.util.List<Integer>> ans = new java.util.ArrayList<>();\n    backtrack(0, nums, new java.util.ArrayList<>(), ans);\n    return ans;\n  }\n  void backtrack(int i, int[] nums, java.util.List<Integer> cur, java.util.List<java.util.List<Integer>> ans) {\n    if (i == nums.length) { ans.add(new java.util.ArrayList<>(cur)); return; }\n    cur.add(nums[i]); backtrack(i + 1, nums, cur, ans); cur.remove(cur.size() - 1);\n    backtrack(i + 1, nums, cur, ans);\n  }\n}`,
  Trees: `class TreesDemo {\n  static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }\n  int height(TreeNode root) {\n    if (root == null) return 0;\n    return 1 + Math.max(height(root.left), height(root.right));\n  }\n}`,
  'Binary Search Trees': `class BinarySearchTreesDemo {\n  static class TreeNode { int val; TreeNode left, right; TreeNode(int v) { val = v; } }\n  boolean search(TreeNode root, int target) {\n    while (root != null) {\n      if (root.val == target) return true;\n      root = target < root.val ? root.left : root.right;\n    }\n    return false;\n  }\n}`,
  Heaps: `class HeapsDemo {\n  int kthLargest(int[] nums, int k) {\n    java.util.PriorityQueue<Integer> pq = new java.util.PriorityQueue<>();\n    for (int n : nums) {\n      pq.offer(n);\n      if (pq.size() > k) pq.poll();\n    }\n    return pq.peek();\n  }\n}`,
  Graphs: `class GraphsDemo {\n  int countComponents(int n, int[][] edges) {\n    java.util.List<java.util.List<Integer>> g = new java.util.ArrayList<>();\n    for (int i = 0; i < n; i++) g.add(new java.util.ArrayList<>());\n    for (int[] e : edges) { g.get(e[0]).add(e[1]); g.get(e[1]).add(e[0]); }\n    boolean[] seen = new boolean[n];\n    int components = 0;\n    for (int i = 0; i < n; i++) if (!seen[i]) { components++; dfs(i, g, seen); }\n    return components;\n  }\n  void dfs(int node, java.util.List<java.util.List<Integer>> g, boolean[] seen) {\n    seen[node] = true;\n    for (int nxt : g.get(node)) if (!seen[nxt]) dfs(nxt, g, seen);\n  }\n}`,
  'Dynamic Programming': `class DynamicProgrammingDemo {\n  int climbStairs(int n) {\n    if (n <= 2) return n;\n    int a = 1, b = 2;\n    for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }\n    return b;\n  }\n}`,
  'Greedy Algorithms': `class GreedyAlgorithmsDemo {\n  int maxNonOverlapping(int[][] intervals) {\n    java.util.Arrays.sort(intervals, java.util.Comparator.comparingInt(a -> a[1]));\n    int count = 0, end = Integer.MIN_VALUE;\n    for (int[] it : intervals) if (it[0] >= end) { count++; end = it[1]; }\n    return count;\n  }\n}`,
  Trie: `class TrieDemo {\n  static class Node { Node[] next = new Node[26]; boolean end; }\n  Node root = new Node();\n  void insert(String word) {\n    Node cur = root;\n    for (char ch : word.toCharArray()) {\n      int i = ch - 'a';\n      if (cur.next[i] == null) cur.next[i] = new Node();\n      cur = cur.next[i];\n    }\n    cur.end = true;\n  }\n}`,
  'Segment Trees': `class SegmentTreesDemo {\n  int[] tree;\n  SegmentTreesDemo(int n) { tree = new int[4 * n]; }\n  int query(int node, int l, int r, int ql, int qr) {\n    if (qr < l || r < ql) return 0;\n    if (ql <= l && r <= qr) return tree[node];\n    int m = (l + r) / 2;\n    return query(node * 2, l, m, ql, qr) + query(node * 2 + 1, m + 1, r, ql, qr);\n  }\n}`,
  'Bit Manipulation': `class BitManipulationDemo {\n  boolean isPowerOfTwo(int n) {\n    return n > 0 && (n & (n - 1)) == 0;\n  }\n}`,
  'System Design Basics': `class SystemDesignBasicsDemo {\n  // Typical interview answer uses components: API Gateway, Service, Cache, DB, Queue\n  String approach() {\n    return "Clarify requirements -> Estimate scale -> Design APIs -> Data model -> Caching -> Sharding -> Monitoring";\n  }\n}`,
  'Concurrency Basics': `class ConcurrencyBasicsDemo {\n  private int counter = 0;\n  synchronized void increment() {\n    counter++;\n  }\n  synchronized int value() {\n    return counter;\n  }\n}`
}

const MUST_SOLVE_QUESTIONS = {
  Arrays: ['Two Sum', 'Best Time to Buy and Sell Stock', 'Product of Array Except Self', 'Maximum Subarray', 'Merge Intervals', 'Set Matrix Zeroes', 'Spiral Matrix', 'Rotate Image', 'Subarray Sum Equals K', 'Container With Most Water', '3Sum', 'Trapping Rain Water', 'Maximum Product Subarray', 'Find Pivot Index', 'Longest Consecutive Sequence'],
  'Linked Lists': ['Reverse Linked List', 'Merge Two Sorted Lists', 'Linked List Cycle', 'Linked List Cycle II', 'Remove Nth Node From End of List', 'Reorder List', 'Intersection of Two Linked Lists', 'Palindrome Linked List', 'Copy List with Random Pointer', 'Add Two Numbers', 'Swap Nodes in Pairs', 'Reverse Nodes in k-Group', 'Sort List', 'Flatten a Multilevel Doubly Linked List', 'Odd Even Linked List'],
  Stacks: ['Valid Parentheses', 'Min Stack', 'Evaluate Reverse Polish Notation', 'Daily Temperatures', 'Next Greater Element I', 'Next Greater Element II', 'Largest Rectangle in Histogram', 'Decode String', 'Basic Calculator II', 'Remove K Digits', 'Asteroid Collision', 'Online Stock Span', 'Simplify Path', 'Score of Parentheses', 'Car Fleet'],
  Queues: ['Implement Queue using Stacks', 'Design Circular Queue', 'Number of Recent Calls', 'Time Needed to Buy Tickets', 'Sliding Window Maximum', 'Binary Tree Level Order Traversal', 'Rotting Oranges', 'Open the Lock', 'Walls and Gates', 'Dota2 Senate', 'Moving Average from Data Stream', 'First Unique Character in a Stream', 'Design Hit Counter', 'Number of Islands BFS', 'Task Scheduler'],
  'Sliding Window': ['Longest Substring Without Repeating Characters', 'Minimum Window Substring', 'Permutation in String', 'Find All Anagrams in a String', 'Longest Repeating Character Replacement', 'Maximum Average Subarray I', 'Subarray Product Less Than K', 'Max Consecutive Ones III', 'Fruits Into Baskets', 'Longest Subarray of 1s After Deleting One Element', 'Minimum Size Subarray Sum', 'Sliding Window Maximum', 'Count Number of Nice Subarrays', 'Grumpy Bookstore Owner', 'Longest Turbulent Subarray'],
  'Two Pointer Technique': ['Two Sum II - Input Array Is Sorted', 'Container With Most Water', '3Sum', '4Sum', 'Remove Duplicates from Sorted Array', 'Move Zeroes', 'Valid Palindrome', 'Squares of a Sorted Array', 'Merge Sorted Array', 'Sort Colors', 'Trapping Rain Water', 'Backspace String Compare', 'Is Subsequence', 'Boats to Save People', 'Partition Labels'],
  'Binary Search': ['Binary Search', 'Search Insert Position', 'First Bad Version', 'Search in Rotated Sorted Array', 'Find Minimum in Rotated Sorted Array', 'Find Peak Element', 'Koko Eating Bananas', 'Capacity To Ship Packages Within D Days', 'Median of Two Sorted Arrays', 'Search a 2D Matrix', 'Time Based Key-Value Store', 'Find First and Last Position of Element in Sorted Array', 'Sqrt(x)', 'Split Array Largest Sum', 'Minimize Max Distance to Gas Station'],
  Recursion: ['Pow(x, n)', 'Fibonacci Number', 'Climbing Stairs', 'Generate Parentheses', 'Letter Combinations of a Phone Number', 'Combination Sum', 'Combination Sum II', 'Permutations', 'Subsets', 'Subsets II', 'N-Queens', 'Unique Paths', 'Decode Ways', 'Different Ways to Add Parentheses', 'Binary Tree Inorder Traversal'],
  Backtracking: ['N-Queens', 'Sudoku Solver', 'Word Search', 'Palindrome Partitioning', 'Combination Sum', 'Combination Sum II', 'Permutations', 'Permutations II', 'Subsets', 'Subsets II', 'Restore IP Addresses', 'Letter Combinations of a Phone Number', 'Generate Parentheses', 'Partition to K Equal Sum Subsets', 'Rat in a Maze'],
  Trees: ['Binary Tree Inorder Traversal', 'Binary Tree Preorder Traversal', 'Binary Tree Postorder Traversal', 'Binary Tree Level Order Traversal', 'Maximum Depth of Binary Tree', 'Diameter of Binary Tree', 'Same Tree', 'Symmetric Tree', 'Path Sum', 'Binary Tree Right Side View', 'Lowest Common Ancestor of a Binary Tree', 'Serialize and Deserialize Binary Tree', 'Binary Tree Zigzag Level Order Traversal', 'Construct Binary Tree from Preorder and Inorder Traversal', 'Balanced Binary Tree'],
  'Binary Search Trees': ['Validate Binary Search Tree', 'Kth Smallest Element in a BST', 'Lowest Common Ancestor of a BST', 'Insert into a BST', 'Delete Node in a BST', 'Search in a BST', 'Convert Sorted Array to BST', 'BST Iterator', 'Two Sum IV - Input is a BST', 'Range Sum of BST', 'Recover Binary Search Tree', 'Trim a BST', 'Convert BST to Greater Tree', 'Balance a BST', 'Closest Binary Search Tree Value'],
  Heaps: ['Kth Largest Element in an Array', 'Top K Frequent Elements', 'Merge k Sorted Lists', 'Find Median from Data Stream', 'Last Stone Weight', 'Task Scheduler', 'Reorganize String', 'K Closest Points to Origin', 'Furthest Building You Can Reach', 'Smallest Range Covering Elements from K Lists', 'IPO', 'Maximum Performance of a Team', 'Sort Characters by Frequency', 'Ugly Number II', 'Minimum Cost to Connect Sticks'],
  Graphs: ['Number of Islands', 'Clone Graph', 'Course Schedule', 'Course Schedule II', 'Pacific Atlantic Water Flow', 'Surrounded Regions', 'Rotting Oranges', 'Word Ladder', 'Network Delay Time', 'Cheapest Flights Within K Stops', 'Redundant Connection', 'Is Graph Bipartite', 'Number of Connected Components in an Undirected Graph', 'Alien Dictionary', 'Critical Connections in a Network'],
  'Dynamic Programming': ['Climbing Stairs', 'House Robber', 'House Robber II', 'Coin Change', 'Coin Change II', 'Longest Increasing Subsequence', 'Longest Common Subsequence', '0/1 Knapsack', 'Partition Equal Subset Sum', 'Edit Distance', 'Decode Ways', 'Unique Paths', 'Maximum Product Subarray', 'Best Time to Buy and Sell Stock with Cooldown', 'Target Sum'],
  'Greedy Algorithms': ['Jump Game', 'Jump Game II', 'Gas Station', 'Candy', 'Non-overlapping Intervals', 'Meeting Rooms II', 'Assign Cookies', 'Lemonade Change', 'Queue Reconstruction by Height', 'Partition Labels', 'Minimum Number of Arrows to Burst Balloons', 'Task Scheduler', 'Advantage Shuffle', 'Reorganize String', 'Bag of Tokens'],
  Trie: ['Implement Trie (Prefix Tree)', 'Design Add and Search Words Data Structure', 'Word Search II', 'Replace Words', 'Map Sum Pairs', 'Longest Word in Dictionary', 'Search Suggestions System', 'Maximum XOR of Two Numbers in an Array', 'Implement Magic Dictionary', 'Concatenated Words', 'Stream of Characters', 'Prefix and Suffix Search', 'Palindrome Pairs', 'Camelcase Matching', 'Word Break with Trie'],
  'Segment Trees': ['Range Sum Query - Mutable', 'Range Minimum Query', 'Count of Smaller Numbers After Self', 'The Skyline Problem', 'Falling Squares', 'Range Module', 'My Calendar III', 'Longest Increasing Subsequence II', 'Handle Sum Queries After Update', 'Range Frequency Queries', 'Create Sorted Array through Instructions', 'Corporate Flight Bookings', 'NumArray with Updates', 'Segment Tree Lazy Propagation Template', 'K-th One Query in Binary Array'],
  'Bit Manipulation': ['Single Number', 'Single Number II', 'Number of 1 Bits', 'Counting Bits', 'Reverse Bits', 'Bitwise AND of Numbers Range', 'Sum of Two Integers', 'Missing Number', 'Power of Two', 'Power of Four', 'Subsets', 'Maximum XOR of Two Numbers in an Array', 'Gray Code', 'Divide Two Integers', 'Hamming Distance'],
  'System Design Basics': ['Design TinyURL', 'Design Twitter', 'Design LRU Cache Service', 'Design URL Shortener', 'Design Rate Limiter', 'Design Chat System', 'Design Notification System', 'Design News Feed', 'Design Ride Sharing System', 'Design File Storage Service', 'Design Video Streaming Platform', 'Design Search Autocomplete', 'Design Online Judge', 'Design Payment Wallet', 'Design Logging and Monitoring Pipeline'],
  'Concurrency Basics': ['Print in Order', 'Print FooBar Alternately', 'Print Zero Even Odd', 'Fizz Buzz Multithreaded', 'Building H2O', 'The Dining Philosophers', 'Traffic Light Controlled Intersection', 'Bounded Blocking Queue', 'Web Crawler Multithreaded', 'Design Thread-Safe LRU Cache', 'Producer Consumer Problem', 'Reader Writer Lock', 'Semaphore Based Barber Shop', 'Deadlock Detection Simulation', 'Thread-safe Singleton Pattern']
}

const MEMORY_SHEETS = {
  Arrays: ['Prefix sum: pref[i] = pref[i - 1] + a[i]', 'Subarray sum (l..r): pref[r] - pref[l - 1]', 'Kadane transition: curr = max(x, curr + x)', 'Two-pass optimization with prefix/suffix'],
  'Linked Lists': ['Fast/slow pointer for cycle and middle', 'Reverse template with prev/curr/next', 'Dummy node simplifies head updates', 'Always store next before rewiring'],
  Stacks: ['Monotonic stack for next greater/smaller', 'Push indices when position matters', 'Pop until invariant is restored', 'Balanced bracket mapping via expected closing'],
  Queues: ['BFS processes level by level', 'Deque supports O(1) front/back operations', 'Queue invariant: process in insertion order', 'For level size: iterate using current queue length'],
  'Sliding Window': ['Maintain window validity before scoring answer', 'Frequency map + left/right pointers', 'Expand right, shrink left on violation', 'Answer often updated after each valid state'],
  'Two Pointer Technique': ['Sorted arrays enable directional pointer moves', 'left++ or right-- based on target relation', 'Use while(left < right)', 'Avoid duplicate results with skip loops'],
  'Binary Search': ['mid = low + (high - low) / 2', 'Invariant decides boundary updates', 'Search on answer uses monotonic predicate', 'End state gives first/last valid boundary'],
  Recursion: ['Base case must terminate every path', 'Recurrence defines subproblem relation', 'Call stack depth affects memory O(h)', 'Memoization converts exponential to polynomial'],
  Backtracking: ['Choose -> Explore -> Unchoose', 'Prune invalid paths early', 'Use local path + global answer', 'State restoration is mandatory'],
  Trees: ['DFS preorder/inorder/postorder patterns', 'Height recursion: 1 + max(left, right)', 'Path problems combine child contributions', 'Level order uses queue'],
  'Binary Search Trees': ['BST property: left < root < right', 'Inorder traversal gives sorted order', 'Kth smallest via inorder count', 'Insert/delete preserve BST invariants'],
  Heaps: ['Min-heap for k largest (size k)', 'Max-heap for repeated top extraction', 'Heap push/pop is O(log n)', 'Priority queue handles streaming data'],
  Graphs: ['Adjacency list for sparse graphs', 'Visited set prevents revisits', 'BFS for shortest unweighted path', 'Topo sort for DAG dependency order'],
  'Dynamic Programming': ['State definition is core', 'Transition from smaller solved states', 'Memoization top-down vs tabulation bottom-up', 'Space optimize with rolling variables when possible'],
  'Greedy Algorithms': ['Sort by greedy criterion', 'Local optimal choice each step', 'Need proof (exchange/invariant)', 'If proof fails, consider DP'],
  Trie: ['Each edge = character transition', 'Node has children + end flag', 'Insert/search are O(length)', 'Prefix queries stop at missing child'],
  'Segment Trees': ['Node stores range aggregate', 'Query splits by overlap type', 'Point update propagates upward', 'Lazy propagation for range updates'],
  'Bit Manipulation': ['n & (n - 1) removes lowest set bit', 'x ^ x = 0 and x ^ 0 = x', 'Use masks for set/clear/toggle bits', 'Shift operators for multiply/divide by powers of 2'],
  'System Design Basics': ['Latency vs throughput trade-off', 'CAP and consistency decisions', 'Cache-aside pattern for read-heavy systems', 'Horizontal scaling + partitioning strategy'],
  'Concurrency Basics': ['Mutual exclusion for critical sections', 'Avoid deadlock: ordered lock acquisition', 'Producer-consumer via blocking queue', 'Prefer immutability to reduce shared state bugs']
}

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
  ].join('\n')
}

const buildExpectedInterviewAnswers = (topic) => {
  return [
    `Q1: What is ${topic} and when should you use it?`,
    `A1: ${topic} is useful when the problem structure matches its core pattern and constraints. I use it when it offers a clear invariant and better complexity than brute force.`,
    '',
    `Q2: How do you decide between brute force and optimized approach?`,
    'A2: I start with brute force for correctness, then optimize by removing repeated work, reducing nested loops, and using better data structures while preserving correctness.',
    '',
    'Q3: What edge cases do you always test first?',
    'A3: Empty input, minimal size input, duplicate-heavy input, already-sorted/structured input (if applicable), and extreme constraints.',
    '',
    `Q4: How do you prove your ${topic} solution is correct?`,
    'A4: I define an invariant, show it is true initially, remains true after each transition, and guarantees correctness when the loop/recursion terminates.',
    '',
    'Q5: What is the biggest implementation risk?',
    'A5: Incorrect update order and boundary handling. I reduce this risk with a dry run and by explicitly checking transitions.',
    '',
    'Q6: How do you discuss complexity confidently?',
    'A6: I break down each operation count and data structure cost, then state total time and auxiliary space in best/worst cases.',
    '',
    'Q7: If interviewer changes constraints, how do you adapt?',
    'A7: I reassess bottlenecks first, then swap to scalable structures/approaches and explain trade-offs clearly.',
    '',
    'Q8: What if your first optimized attempt fails on one test?',
    'A8: I isolate failing input, trace variables, verify invariant, and patch logic without breaking already passing cases.',
    '',
    'Q9: How do you explain trade-offs between readability and performance?',
    'A9: I prefer clear code with comments for invariants, then optimize hotspots only when complexity or constraints require it.',
    '',
    `Q10: Final one-line interview summary for ${topic}?`,
    `A10: Select the right ${topic} pattern, preserve invariant at every step, and justify complexity with edge-case-safe implementation.`
  ].join('\n')
}

const createNoteContent = (topic) => {
  const overview = TOPIC_OVERVIEWS[topic] || `${topic} is a core interview area. Learn patterns, edge cases, and optimization trade-offs.`
  const pseudocode = TOPIC_PSEUDOCODE[topic] || '1. Define input/output\n2. Choose an approach\n3. Track state\n4. Return answer'
  const javaExample = TOPIC_JAVA_EXAMPLES[topic] || `class ${topic.replace(/[^A-Za-z0-9]/g, '')}Demo {\n  int solve(int[] nums) {\n    return nums.length;\n  }\n}`
  const mustSolve = MUST_SOLVE_QUESTIONS[topic] || []
  const memorySheet = MEMORY_SHEETS[topic] || []
  const thirtyDayPlan = buildThirtyDaySchedule(topic)
  const expectedAnswers = buildExpectedInterviewAnswers(topic)

  return `Concept explanation:
Overview:
${overview}

Why this topic matters in placements:
- It appears frequently in online assessments and first technical rounds.
- It tests both coding speed and reasoning clarity.
- It is often used as a base pattern for harder mixed problems.

Core theory and mental model:
- Understand what data/state must be tracked at each step.
- Keep one invariant that remains true throughout execution.
- Think in terms of transitions: current state -> next state.
- Decide early whether brute force, optimized, or hybrid approach fits best.

Interview framework (what to say before coding):
1. Clarify inputs, constraints, and output format.
2. Describe brute-force approach and complexity.
3. Explain optimized approach and why it is correct.
4. Mention edge cases and expected behavior.
5. State final time and space complexity.

Important patterns within ${topic}:
- Standard template/pattern recognition
- Boundary handling and index safety
- Space optimization vs readability trade-off
- Precomputation (if needed) to reduce repeated work

Common mistakes to avoid:
- Ignoring null/empty or boundary cases
- Breaking invariant during loop/recursion
- Confusing update order of variables/pointers
- Returning before all states are validated

Complexity checklist:
- Best case, average case, worst case
- Extra memory used by data structures/recursion stack
- Can we reduce from O(n^2) to O(n log n) or O(n)?
- Is in-place mutation acceptable for this question?

How to practice ${topic} effectively:
- Day 1: Learn 2 classic easy patterns and implement from scratch.
- Day 2: Solve 3 medium problems with strict time limit.
- Day 3: Re-solve yesterday problems without looking at code.
- Day 4: Practice 1 hard problem and write explanation in your own words.
- Day 5: Mixed set (easy + medium + medium) to test pattern transfer.
- Day 6: Mock interview round (45 minutes).
- Day 7: Revision sheet + error log review.

Mini interview Q&A for quick revision:
Q1: How do you know this approach is correct?
A1: Because the invariant is preserved at every step and covers all valid states.

Q2: What are the edge cases?
A2: Empty input, single element/node, repeated values, extreme constraints, and overflow-sensitive operations.

Q3: Can this be optimized further?
A3: Usually by reducing nested loops, avoiding repeated scans, or replacing extra storage with in-place updates where safe.

Q4: Why is this complexity acceptable?
A4: It matches or improves the lower-bound expectation for the class of problem under interview constraints.

Problem taxonomy for ${topic}:
- Recognition problems: identify which known pattern fits the prompt.
- Construction problems: build required output while preserving constraints.
- Optimization problems: minimize/maximize objective safely.
- Validation problems: verify structure/state correctness efficiently.
- Counting problems: count valid configurations/components/paths.

Deep-dive checklist (advanced understanding):
- Can you derive this optimized method from brute force?
- Can you defend correctness with an invariant/proof sketch?
- Can you explain why alternate approaches fail on edge cases?
- Can you adapt this logic if constraints are 10x larger?
- Can you express this both iteratively and recursively?

Optimization playbook:
- Remove repeated work with caching or precomputation.
- Replace nested loops using pointer/window/monotonic patterns when valid.
- Reduce memory by storing only essential state.
- Prefer stable update order to avoid state corruption bugs.
- Benchmark complexity against interviewer-expected bounds.

Debugging workflow in interviews:
1. Start with the smallest possible dry-run input.
2. Print/trace key variables after each transition.
3. Re-check boundary movement and stop conditions.
4. Validate one extreme edge case before finalizing.
5. Reconfirm complexity after bug fixes.

Communication template while solving:
- "I will start with baseline and then optimize."
- "The invariant I am maintaining is ..."
- "This update is safe because ..."
- "This handles edge case X by ..."
- "Final complexity is ... and trade-off is ..."

Self-assessment rubric (score 1-5):
- Pattern recognition speed
- Correctness explanation clarity
- Edge-case handling quality
- Complexity confidence
- Clean implementation under time pressure

If any area scores below 3, revise fundamentals and re-solve old questions without seeing prior code.

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
- One-line summary: ${topic} problems are solved by maintaining the right state and invariant.
- Trigger words: optimize, constraints, edge cases, invariant, complexity.
- Final reminder: explain before coding, validate with dry run, then optimize if required.`
}

export const fallbackNotes = NOTE_TOPICS.map((topic, index) => ({
  _id: `${slugify(topic)}-note-fallback`,
  title: `${topic} Notes`,
  topics: [topic],
  visibility: 'Public',
  content: createNoteContent(topic),
  createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - index * 86400000).toISOString()
}))

export const fallbackNoteById = fallbackNotes.reduce((acc, note) => {
  acc[note._id] = note
  return acc
}, {})
