import { useMemo } from 'react'

const conceptVideos = [
  {
    title: 'Arrays - Complete Concept Review',
    channel: 'take U forward',
    topic: 'Arrays',
    duration: '52 min',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=37E9ckMDdTk',
  },
  {
    title: 'Linked Lists Explained',
    channel: 'Abdul Bari',
    topic: 'Linked Lists',
    duration: '34 min',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=lj_ExDKL9BM',
  },
  {
    title: 'Stacks Data Structure',
    channel: 'mycodeschool',
    topic: 'Stacks',
    duration: '29 min',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=F1F2imiOJfk',
  },
  {
    title: 'Queues in Data Structures',
    channel: 'Neso Academy',
    topic: 'Queues',
    duration: '31 min',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=okr-XE8yTO8',
  },
  {
    title: 'Sliding Window Technique',
    channel: 'NeetCode',
    topic: 'Sliding Window',
    duration: '41 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=MK-NZ4hN7rs',
  },
  {
    title: 'Two Pointer Technique Patterns',
    channel: 'take U forward',
    topic: 'Two Pointer Technique',
    duration: '44 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=QzZ7nmouLTI',
  },
  {
    title: 'Binary Search Patterns',
    channel: 'Aditya Verma',
    topic: 'Binary Search',
    duration: '39 min',
    level: 'Beginner',
    url: 'https://www.youtube.com/watch?v=4sQL7R5ySUU',
  },
  {
    title: 'Recursion Fundamentals',
    channel: 'freeCodeCamp.org',
    topic: 'Recursion',
    duration: '46 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=IJDJ0kBx2LM',
  },
  {
    title: 'Backtracking Complete Guide',
    channel: 'NeetCode',
    topic: 'Backtracking',
    duration: '55 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=DKCbsiDBN6c',
  },
  {
    title: 'Trees and Traversals',
    channel: 'mycodeschool',
    topic: 'Trees',
    duration: '52 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=_ANrF3FJm7I',
  },
  {
    title: 'Binary Search Trees (BST) Concepts',
    channel: 'Abdul Bari',
    topic: 'Binary Search Trees',
    duration: '43 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=aQYz2qpmzEw',
  },
  {
    title: 'Heaps and Priority Queue',
    channel: 'freeCodeCamp.org',
    topic: 'Heaps',
    duration: '54 min',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=HqPJF2L5h9U',
  },
  {
    title: 'Graph Algorithms Essentials',
    channel: 'freeCodeCamp.org',
    topic: 'Graphs',
    duration: '1h 09m',
    level: 'Intermediate',
    url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
  },
  {
    title: 'Dynamic Programming Patterns',
    channel: 'NeetCode',
    topic: 'Dynamic Programming',
    duration: '1h 12m',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
  },
  {
    title: 'Greedy Algorithms Explained',
    channel: 'Abdul Bari',
    topic: 'Greedy Algorithms',
    duration: '47 min',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=ARvQcqJ_-NY',
  },
  {
    title: 'Trie Data Structure for Strings',
    channel: 'WilliamFiset',
    topic: 'Trie',
    duration: '36 min',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=zIjfhVPRZCg',
  },
  {
    title: 'Segment Tree Full Tutorial',
    channel: 'Errichto',
    topic: 'Segment Trees',
    duration: '59 min',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=ZBHKZF5w4YU',
  },
  {
    title: 'Bit Manipulation Essentials',
    channel: 'take U forward',
    topic: 'Bit Manipulation',
    duration: '1h 05m',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=5rtVTYAk9KQ',
  },
  {
    title: 'System Design Basics for Placements',
    channel: 'Gaurav Sen',
    topic: 'System Design Basics',
    duration: '48 min',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=xpDnVSmNFX0',
  },
  {
    title: 'Concurrency and Multithreading Basics',
    channel: 'Java Brains',
    topic: 'Concurrency Basics',
    duration: '51 min',
    level: 'Advanced',
    url: 'https://www.youtube.com/watch?v=r_MbozD32eo',
  },
]

const interviewQuestions = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    channel: 'NeetCode',
    duration: '13 min',
    url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA',
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '22 min',
    url: 'https://www.youtube.com/watch?v=wiGpQwVHdE0',
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    channel: 'NeetCode',
    duration: '11 min',
    url: 'https://www.youtube.com/watch?v=WTzjTskDFMg',
  },
  {
    title: 'Merge Intervals',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '17 min',
    url: 'https://www.youtube.com/watch?v=44H3cEC2fFM',
  },
  {
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '14 min',
    url: 'https://www.youtube.com/watch?v=6ZnyEApgFYg',
  },
  {
    title: 'LRU Cache',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '27 min',
    url: 'https://www.youtube.com/watch?v=7ABFKPK2hD4',
  },
  {
    title: 'Detect Cycle in Linked List',
    difficulty: 'Easy',
    channel: 'NeetCode',
    duration: '10 min',
    url: 'https://www.youtube.com/watch?v=gBTe7lFR3vc',
  },
  {
    title: 'Kth Largest Element',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '16 min',
    url: 'https://www.youtube.com/watch?v=XEmy13g1Qxc',
  },
  {
    title: 'Number of Islands',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '18 min',
    url: 'https://www.youtube.com/watch?v=pV2kpPD66nE',
  },
  {
    title: 'Course Schedule',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '19 min',
    url: 'https://www.youtube.com/watch?v=EgI5nU9etnU',
  },
  {
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '14 min',
    url: 'https://www.youtube.com/watch?v=YPTqKIgVk-k',
  },
  {
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    channel: 'NeetCode',
    duration: '8 min',
    url: 'https://www.youtube.com/watch?v=Y0lT9Fck7qI',
  },
  {
    title: 'Coin Change',
    difficulty: 'Medium',
    channel: 'NeetCode',
    duration: '20 min',
    url: 'https://www.youtube.com/watch?v=H9bfqozjoqs',
  },
  {
    title: 'Word Ladder',
    difficulty: 'Hard',
    channel: 'NeetCode',
    duration: '23 min',
    url: 'https://www.youtube.com/watch?v=h9iTnkgv05E',
  },
  {
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    channel: 'NeetCode',
    duration: '26 min',
    url: 'https://www.youtube.com/watch?v=jSto0O4AJbM',
  },
]

export default function ConceptLearningPage() {
  const groupedByLevel = useMemo(() => {
    return conceptVideos.reduce((accumulator, video) => {
      if (!accumulator[video.level]) accumulator[video.level] = []
      accumulator[video.level].push(video)
      return accumulator
    }, {})
  }, [])

  return (
    <section className="space-y-6 fade-rise">
      <div className="ui-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Concept Learning</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-slate-100">Learn Concepts with YouTube</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Curated concept videos for placement preparation. Pick a topic, watch the explanation, and come back to solve related practice questions.
        </p>
      </div>

      {Object.entries(groupedByLevel).map(([level, videos]) => (
        <div key={level} className="space-y-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">{level}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <article
                key={video.title}
                className="ui-card rounded-2xl p-4 sm:p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Video</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{video.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{video.topic}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{video.channel}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{video.duration}</span>
                </div>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-button ui-button-primary mt-4 inline-flex px-3 py-2 text-sm"
                >
                  Watch on YouTube
                </a>
              </article>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">Interview Questions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {interviewQuestions.map((question) => (
            <article key={question.title} className="ui-card rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Question</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{question.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Difficulty: {question.difficulty}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{question.channel}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{question.duration}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={question.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-button ui-button-primary inline-flex px-3 py-2 text-sm"
                >
                  Watch on YouTube
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
