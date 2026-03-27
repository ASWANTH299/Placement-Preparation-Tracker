export const DEFAULT_BOX_TITLES = {
  1: 'Concept Explanation',
  2: 'Pseudocode',
  3: 'Java Code with Explanation',
  4: 'Expected Interview Questions',
  5: '15 Must-Solve Question Names',
  6: '30-Day Schedule'
}

const DEFAULT_BOX_CONTENT = {
  1: 'Concept explanation will appear here once this note section is available.',
  2: 'Pseudocode steps will appear here once this note section is available.',
  3: 'Java code and explanation will appear here once this note section is available.',
  4: 'Expected interview questions will appear here once this note section is available.',
  5: 'Must-solve question list will appear here once this note section is available.',
  6: '30-day schedule will appear here once this note section is available.'
}

const HEADING_TO_NUMBER = {
  'Concept Explanation': 1,
  Pseudocode: 2,
  'Java Code with Explanation': 3,
  'Expected Interview Questions': 4,
  '15 Must-Solve Question Names': 5,
  '30-Day Schedule': 6
}

export const getBoxTag = (title = '') => {
  const value = String(title || '').toLowerCase()
  if (value.includes('concept')) return 'Insight'
  if (value.includes('pseudocode')) return 'Flow'
  if (value.includes('java')) return 'Code'
  if (value.includes('expected interview')) return 'Interview'
  if (value.includes('15 must-solve')) return 'Practice'
  if (value.includes('30-day')) return 'Schedule'
  return 'Section'
}

export const parseNoteBoxes = (content = '') => {
  const text = String(content || '')

  const boxedSections = []
  const boxRegex = /\[Box\s*(\d+)\]\s*([^\n]+)\n([\s\S]*?)(?=\n\[Box\s*\d+\]|$)/gi
  let match = boxRegex.exec(text)

  while (match) {
    boxedSections.push({
      number: Number(match[1]),
      title: (match[2] || '').trim(),
      content: (match[3] || '').trim()
    })
    match = boxRegex.exec(text)
  }

  if (boxedSections.length > 0) {
    return normalizeToSixBoxes(boxedSections.sort((a, b) => a.number - b.number))
  }

  const headingSections = []
  const headingRegex = /(Concept Explanation|Pseudocode|Java Code with Explanation|Expected Interview Questions|15 Must-Solve Question Names|30-Day Schedule):\s*([\s\S]*?)(?=(?:\n(?:Concept Explanation|Pseudocode|Java Code with Explanation|Expected Interview Questions|15 Must-Solve Question Names|30-Day Schedule):)|$)/g
  let headingMatch = headingRegex.exec(text)

  while (headingMatch) {
    const title = (headingMatch[1] || '').trim()
    headingSections.push({
      number: HEADING_TO_NUMBER[title] || 99,
      title,
      content: (headingMatch[2] || '').trim()
    })
    headingMatch = headingRegex.exec(text)
  }

  if (headingSections.length > 0) {
    return normalizeToSixBoxes(headingSections.sort((a, b) => a.number - b.number))
  }

  const conceptMatch = text.match(/Concept(?: explanation)?:\s*([\s\S]*?)(?=\n\nPseudocode:|\n\nJava example:|$)/i)
  const pseudoMatch = text.match(/Pseudocode:\s*([\s\S]*?)(?=\n\nJava example:|$)/i)
  const javaMatch = text.match(/Java example:\s*([\s\S]*?)$/i)

  return normalizeToSixBoxes([
    {
      number: 1,
      title: DEFAULT_BOX_TITLES[1],
      content: (conceptMatch?.[1] || '').trim() || text.trim() || 'No concept explanation available.'
    },
    {
      number: 2,
      title: DEFAULT_BOX_TITLES[2],
      content: (pseudoMatch?.[1] || '').trim() || 'No pseudocode available.'
    },
    {
      number: 3,
      title: DEFAULT_BOX_TITLES[3],
      content: (javaMatch?.[1] || '').trim() || 'No Java example available.'
    }
  ])
}

export const buildNoteContentFromBoxes = (sections = []) => {
  const normalized = normalizeToSixBoxes(sections)
  return normalized
    .map((section) => `[Box ${section.number}] ${section.title}\n${String(section.content || '').trim()}`)
    .join('\n\n')
}

const normalizeToSixBoxes = (sections = []) => {
  const map = new Map()

  for (const section of sections) {
    if (!section?.number || section.number < 1 || section.number > 6) continue
    map.set(section.number, {
      number: section.number,
      title: section.title || DEFAULT_BOX_TITLES[section.number],
      content: String(section.content || '').trim() || DEFAULT_BOX_CONTENT[section.number]
    })
  }

  return [1, 2, 3, 4, 5, 6].map((number) => {
    if (map.has(number)) return map.get(number)
    return {
      number,
      title: DEFAULT_BOX_TITLES[number],
      content: DEFAULT_BOX_CONTENT[number]
    }
  })
}
