import { useMemo, useState } from 'react'

const hrQuestions = [
  {
    question: 'Why should we hire you?',
    answer:
      'You should hire me because I bring a strong mix of technical foundation, consistent learning habits, and a team-oriented attitude. I take ownership of tasks, communicate clearly, and focus on delivering reliable outcomes. I am confident that I can contribute quickly while continuing to grow with your team.',
    explanation:
      'Connect your skills to the role, mention work ethic, and show confidence without sounding overconfident.',
  },
  {
    question: 'Why do you want to work at this company?',
    answer:
      'I want to work at this company because it has a strong reputation for innovation and meaningful impact in the industry. I admire the company\'s culture of learning, collaboration, and quality. This role aligns with my goals, and I believe I can contribute while also growing professionally in a high-performing environment.',
    explanation:
      'Show that you researched the company and link its values and work style to your personal goals.',
  },
  {
    question: 'Tell me about yourself.',
    answer:
      'I am a motivated student focused on building a career in software development. I have been strengthening my skills through coding practice, projects, and structured preparation. I enjoy solving problems, learning new technologies, and collaborating with others. I am currently looking for an opportunity where I can apply my skills and continue learning from experienced professionals.',
    explanation:
      'Use a present-past-future structure: who you are now, what built your profile, and what you are aiming for next.',
  },
  {
    question: 'What are your strengths?',
    answer:
      'One of my biggest strengths is consistency. I set clear goals and follow through with discipline. I am also a quick learner and adapt well to new tools and workflows. In team settings, I communicate proactively and make sure tasks are completed with quality and on time.',
    explanation:
      'Pick 2-3 strengths and support each with practical behavior instead of only adjectives.',
  },
  {
    question: 'What are your weaknesses?',
    answer:
      'Earlier, I used to spend too much time perfecting small details, which sometimes slowed me down. I have improved by setting clear time limits and prioritizing impact over perfection. This helped me maintain quality while delivering work faster and more consistently.',
    explanation:
      'Share a real weakness, then explain concrete steps you are taking to improve it.',
  },
  {
    question: 'Where do you see yourself in five years?',
    answer:
      'In five years, I see myself as a dependable software professional who can own features end-to-end and mentor junior team members. I want to deepen my expertise in system design and product thinking while contributing to projects that create measurable user value.',
    explanation:
      'Keep goals ambitious but realistic, and align them with growth inside the company.',
  },
  {
    question: 'Why should we hire you over other candidates?',
    answer:
      'I offer a combination of strong fundamentals, practical project experience, and a growth mindset. I prepare thoroughly, accept feedback positively, and adapt quickly to team expectations. Along with technical ability, I bring accountability and a collaborative approach that helps teams execute effectively.',
    explanation:
      'Differentiate yourself through habits and outcomes, not by comparing negatively with others.',
  },
  {
    question: 'Tell me about a challenge you faced.',
    answer:
      'During a project, I faced integration issues between frontend and backend modules close to a deadline. I broke the problem into smaller parts, coordinated with teammates, and tested each flow systematically. We identified root causes, fixed them quickly, and delivered on time with stable functionality.',
    explanation:
      'Use the STAR format: Situation, Task, Action, Result.',
  },
  {
    question: 'Describe a time you worked in a team.',
    answer:
      'In a group project, I took responsibility for coordinating API integration and progress tracking. I regularly communicated blockers, aligned interfaces with teammates, and helped review key changes. Our collaboration reduced rework and allowed us to complete the project smoothly before submission.',
    explanation:
      'Highlight your role, communication habits, and how teamwork improved the final result.',
  },
  {
    question: 'How do you handle pressure?',
    answer:
      'I handle pressure by staying organized and focusing on priorities. I break complex work into smaller tasks, estimate effort, and track progress continuously. When needed, I communicate early about risks so we can adjust quickly and keep the work on schedule.',
    explanation:
      'Show calm decision-making, structured execution, and proactive communication.',
  },
  {
    question: 'What motivates you?',
    answer:
      'I am motivated by continuous improvement and meaningful outcomes. I enjoy learning new concepts, solving challenging problems, and seeing my work create value for users or teams. Progress, responsibility, and the chance to contribute to impactful projects keep me highly driven.',
    explanation:
      'Focus on intrinsic motivation like learning, ownership, and impact.',
  },
  {
    question: 'Why did you choose your field of study?',
    answer:
      'I chose this field because I enjoy logical problem-solving and building practical solutions using technology. The combination of analytical thinking and real-world application attracted me. Over time, projects and practice strengthened my interest and confirmed that this is the right career path for me.',
    explanation:
      'Keep it personal and authentic, and connect your choice to ongoing effort and outcomes.',
  },
  {
    question: 'What are your career goals?',
    answer:
      'My short-term goal is to become a strong contributor in a professional software team by delivering reliable features and learning best practices. My long-term goal is to grow into a role where I can design scalable systems, lead initiatives, and mentor others while continuing to learn.',
    explanation:
      'Include both short-term and long-term goals, with a clear progression path.',
  },
  {
    question: 'Are you willing to relocate?',
    answer:
      'Yes, I am open to relocating if the role requires it. I see relocation as an opportunity to grow professionally and adapt to new environments. I am flexible and prepared to make the transition based on the organization\'s needs.',
    explanation:
      'Answer clearly and positively while showing professionalism and flexibility.',
  },
  {
    question: 'Do you have any questions for us?',
    answer:
      'Yes, I would like to know how success is measured for this role in the first six months. I am also interested in understanding the team\'s working style, mentorship opportunities, and the kind of projects I would initially contribute to.',
    explanation:
      'Ask thoughtful questions about expectations, team culture, and learning opportunities.',
  },
]

export default function HRInterviewPage() {
  const [activeIndex, setActiveIndex] = useState(0)

  const activeQuestion = useMemo(() => hrQuestions[activeIndex], [activeIndex])

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? hrQuestions.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setActiveIndex((prev) => (prev === hrQuestions.length - 1 ? 0 : prev + 1))
  }

  return (
    <section className="fade-rise space-y-6">
      <header className="ui-card overflow-hidden p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Interview Prep</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">HR Interview Preparation</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Practice common HR and behavioral interview questions with recommended answers and clear guidance on how to present each response.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <aside className="ui-card p-4 sm:p-5" aria-label="HR interview questions list">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Questions ({hrQuestions.length})</h2>
          <div className="mt-3 space-y-2">
            {hrQuestions.map((item, index) => {
              const isActive = index === activeIndex
              return (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/60 dark:bg-blue-500/10 dark:text-blue-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/70'
                  }`}
                  aria-expanded={isActive}
                  aria-controls="hr-answer-panel"
                >
                  <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {index + 1}
                  </span>
                  {item.question}
                </button>
              )
            })}
          </div>
        </aside>

        <article id="hr-answer-panel" className="ui-card p-5 sm:p-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Question {activeIndex + 1}</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{activeQuestion.question}</h2>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Recommended Answer</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{activeQuestion.answer}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-500/40 dark:bg-blue-500/10 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-800 dark:text-blue-200">How To Explain It Clearly</h3>
            <p className="mt-2 text-sm leading-relaxed text-blue-900 dark:text-blue-100">{activeQuestion.explanation}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToPrevious}
              className="ui-button ui-button-ghost px-3 py-2 text-sm"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="ui-button ui-button-primary px-3 py-2 text-sm"
            >
              Next
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
