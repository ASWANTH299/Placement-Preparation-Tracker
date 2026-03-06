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

const createNoteContent = (topic) => {
  return `Concept explanation:\n${topic} focuses on interview patterns, edge cases, and optimal trade-offs.\n\nPseudocode:\n1. Understand the input and expected output\n2. Choose a ${topic} strategy\n3. Track state carefully\n4. Return the result\n\nJava example:\nclass ${topic.replace(/[^A-Za-z0-9]/g, '')}Demo {\n  int solve(int[] nums) {\n    int ans = 0;\n    for (int num : nums) ans += num;\n    return ans;\n  }\n}`
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
