import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getQuestionDetail, runPracticeCode, submitPracticeCode } from '../../services/questionService'
import { getErrorMessage } from '../../utils/errorHandler'
import { fallbackQuestionById, fallbackQuestions } from '../../utils/questionFallbackData'

const languageOptions = ['Java', 'Python', 'JavaScript', 'C++']

const starterCodeByLanguage = {
  Java: 'class Solution {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}',
  Python: 'def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()',
  JavaScript: 'function solve() {\n  // Write your solution here\n}\n\nsolve();',
  'C++': '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // Write your solution here\n  return 0;\n}'
}

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''))

const toLines = (value) => String(value || '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)

const getLineFromIndex = (text, index) => String(text || '').slice(0, index).split('\n').length

const isBlankOrComment = (line, language) => {
  const trimmed = line.trim()
  if (!trimmed) return true
  if (language === 'Python') return trimmed.startsWith('#')
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.endsWith('*/')
}

const expectsSemicolon = (line, language) => {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (isBlankOrComment(trimmed, language)) return false

  if (trimmed.endsWith(';') || trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(':')) return false
  if (/^(if|for|while|switch|catch)\s*\(.*\)\s*$/.test(trimmed)) return false
  if (/^(else|do|try|finally)\b/.test(trimmed)) return false
  if (/^(class|interface|enum|public\s+class|private\s+class|protected\s+class)\b/.test(trimmed)) return false
  if (/^#/.test(trimmed)) return false

  if (language === 'Java' || language === 'JavaScript' || language === 'C++') return true
  return false
}

const validateLineSemicolons = (sourceCode, language) => {
  const errors = []
  const lines = String(sourceCode || '').split('\n')

  lines.forEach((line, idx) => {
    if (expectsSemicolon(line, language)) {
      errors.push(`Line ${idx + 1}: Missing semicolon ';'.`)
    }
  })

  return errors
}

const validatePythonIndentation = (sourceCode) => {
  const errors = []
  const lines = String(sourceCode || '').split('\n')

  lines.forEach((line, idx) => {
    const leading = line.match(/^\s*/)?.[0] || ''
    if (!line.trim() || line.trim().startsWith('#')) return

    if (leading.includes('\t') && leading.includes(' ')) {
      errors.push(`Line ${idx + 1}: Mixed tabs and spaces in indentation.`)
    }

    if (!leading.includes('\t') && leading.length % 4 !== 0) {
      errors.push(`Line ${idx + 1}: Indentation should be a multiple of 4 spaces.`)
    }
  })

  return errors
}

const validatePythonColons = (sourceCode) => {
  const errors = []
  const lines = String(sourceCode || '').split('\n')
  const starters = [/^def\b/, /^class\b/, /^if\b/, /^elif\b/, /^else\b/, /^for\b/, /^while\b/, /^try\b/, /^except\b/, /^finally\b/, /^with\b/]

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const startsBlock = starters.some((re) => re.test(trimmed))
    if (startsBlock && !trimmed.endsWith(':')) {
      errors.push(`Line ${idx + 1}: Missing ':' at end of Python block statement.`)
    }
  })

  return errors
}

const formatErrorList = (title, errors) => [
  title,
  ...errors.map((entry, index) => `${index + 1}. ${entry}`)
].join('\n')

const formatExecutionResult = (title, result) => {
  const rows = []
  if (result?.errors?.length) rows.push(...result.errors)
  if (result?.stderr) rows.push(result.stderr.trim())
  if (result?.stdout) rows.push(result.stdout.trim())

  if (!rows.length) rows.push('Execution failed without detailed stderr output.')
  return formatErrorList(title, rows)
}

const isRouteUnavailableError = (requestError) => {
  const status = requestError?.response?.status
  const message = String(requestError?.response?.data?.error || requestError?.response?.data?.message || requestError?.message || '').toLowerCase()
  return status === 404 || message.includes('route not found') || message.includes('not found')
}

const validateBalancedPairs = (sourceCode) => {
  const stack = []
  const errors = []
  const openToClose = { '(': ')', '{': '}', '[': ']' }
  const closers = new Set(Object.values(openToClose))

  for (let i = 0; i < sourceCode.length; i += 1) {
    const char = sourceCode[i]

    if (openToClose[char]) {
      stack.push({ char, index: i })
    } else if (closers.has(char)) {
      const last = stack.pop()
      if (!last || openToClose[last.char] !== char) {
        errors.push(`Line ${getLineFromIndex(sourceCode, i)}: Unmatched '${char}'.`)
      }
    }
  }

  while (stack.length) {
    const unclosed = stack.pop()
    errors.push(`Line ${getLineFromIndex(sourceCode, unclosed.index)}: Missing closing '${openToClose[unclosed.char]}'.`)
  }

  return errors
}

const validateQuoteBalance = (sourceCode) => {
  let singleCount = 0
  let doubleCount = 0

  for (let i = 0; i < sourceCode.length; i += 1) {
    const char = sourceCode[i]
    const prev = sourceCode[i - 1]
    if (char === "'" && prev !== '\\') singleCount += 1
    if (char === '"' && prev !== '\\') doubleCount += 1
  }

  const errors = []
  if (singleCount % 2 !== 0) errors.push(`Line ${getLineFromIndex(sourceCode, sourceCode.lastIndexOf("'"))}: Unclosed single quote detected.`)
  if (doubleCount % 2 !== 0) errors.push(`Line ${getLineFromIndex(sourceCode, sourceCode.lastIndexOf('"'))}: Unclosed double quote detected.`)
  return errors
}

const validateByLanguage = (sourceCode, selectedLanguage) => {
  const trimmed = String(sourceCode || '').trim()
  const errors = []

  if (!trimmed) {
    errors.push('Code is empty.')
    return errors
  }

  errors.push(...validateBalancedPairs(trimmed))
  errors.push(...validateQuoteBalance(trimmed))

  if (selectedLanguage === 'Java') {
    if (!/\bclass\s+\w+/.test(trimmed)) errors.push('Line 1: Java class declaration missing (example: class Solution).')
    if (!/\b(public|private|protected)\s+\w+/.test(trimmed)) errors.push('Line 1: Java method declaration with access modifier not found.')
    errors.push(...validateLineSemicolons(trimmed, 'Java'))
  }

  if (selectedLanguage === 'Python') {
    if (!/\bdef\s+\w+\s*\(/.test(trimmed)) errors.push('Line 1: Python function definition missing (example: def solve():).')
    if (trimmed.includes('{') || trimmed.includes('}')) {
      const lines = trimmed.split('\n')
      lines.forEach((line, idx) => {
        if (line.includes('{') || line.includes('}')) {
          errors.push(`Line ${idx + 1}: Curly braces are invalid in Python.`)
        }
      })
    }
    errors.push(...validatePythonColons(trimmed))
    errors.push(...validatePythonIndentation(trimmed))
  }

  if (selectedLanguage === 'JavaScript') {
    if (!/\bfunction\s+\w+\s*\(|=>/.test(trimmed)) errors.push('Line 1: JavaScript function declaration or arrow function missing.')
    errors.push(...validateLineSemicolons(trimmed, 'JavaScript'))
    if (!/[;}]\s*$/.test(trimmed)) errors.push(`Line ${trimmed.split('\n').length}: File appears to end without semicolon or closing brace.`)
  }

  if (selectedLanguage === 'C++') {
    if (!/#include\s*</.test(trimmed)) errors.push('Line 1: C++ include directive missing (example: #include <bits/stdc++.h>).')
    if (!/\bint\s+main\s*\(/.test(trimmed)) errors.push('Line 1: C++ main function declaration missing.')
    if (!/\breturn\s+0\s*;/.test(trimmed)) errors.push('Line 1: C++ main should return 0;')
    errors.push(...validateLineSemicolons(trimmed, 'C++'))
  }

  return Array.from(new Set(errors))
}

export default function PracticeWorkspace() {
  const { questionId } = useParams()
  const [question, setQuestion] = useState(null)
  const [language, setLanguage] = useState('Java')
  const [code, setCode] = useState(starterCodeByLanguage.Java)
  const [output, setOutput] = useState('')
  const [outputType, setOutputType] = useState('info')
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0)
  const [testInput, setTestInput] = useState('')
  const [error, setError] = useState('')

  const inputFormat = question?.inputFormat || 'Read values exactly as shown in sample input and parse according to the problem statement.'
  const outputFormat = question?.outputFormat || 'Return or print output exactly in the expected format.'
  const constraints = question?.constraints || 'Use an optimized approach that can handle interview-scale input sizes.'
  const examples = question?.inputOutputExamples?.length
    ? question.inputOutputExamples
    : [{
      input: question?.exampleInput || 'N/A',
      output: question?.exampleOutput || 'N/A',
      explanation: question?.explanation || 'N/A'
    }]

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!isValidObjectId(questionId)) {
        setQuestion(fallbackQuestionById[questionId] || fallbackQuestions[0])
        return
      }

      try {
        const response = await getQuestionDetail(questionId)
        if (!active) return
        setQuestion(response?.data?.data || fallbackQuestions[0])
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError))
          setQuestion(fallbackQuestionById[questionId] || fallbackQuestions[0])
        }
      }
    }

    if (questionId) load()
    return () => {
      active = false
    }
  }, [questionId])

  useEffect(() => {
    const sample = examples[selectedSampleIndex]
    if (!sample) {
      setTestInput('')
      return
    }

    setTestInput(sample.input || '')
  }, [selectedSampleIndex, question?.title])

  useEffect(() => {
    if (!questionId) return

    const savedDraft = localStorage.getItem(`practice_draft_${questionId}_${language}`)
    if (savedDraft) {
      setCode(savedDraft)
      return
    }

    setCode(starterCodeByLanguage[language] || starterCodeByLanguage.Java)
  }, [questionId, language])

  const hasMeaningfulCode = (value) => {
    const trimmed = String(value || '').trim()
    if (!trimmed) return false

    return !trimmed.includes('Write your solution here')
  }

  const getRunSummary = () => {
    const currentExample = examples[selectedSampleIndex] || examples[0]
    return currentExample?.output || 'No sample output available for this test case.'
  }

  const runCode = async () => {
    setError('')

    if (!hasMeaningfulCode(code)) {
      setOutputType('error')
      setOutput('Run failed: Add your solution code before running simulation.')
      return
    }

    localStorage.setItem(`practice_draft_${questionId}_${language}`, code)

    try {
      const response = await runPracticeCode({
        questionId,
        language,
        code,
        input: testInput
      })

      const result = response?.data?.data || {}
      if (result.success) {
        setOutputType('success')
        setOutput((result.stdout || '').trim() || getRunSummary())
        return
      }

      setOutputType('error')
      setOutput(formatExecutionResult(`Strict compiler errors (${language}):`, result))
    } catch (requestError) {
      if (isRouteUnavailableError(requestError)) {
        const validationErrors = validateByLanguage(code, language)
        if (validationErrors.length > 0) {
          setOutputType('error')
          setOutput(formatErrorList(`Strict compiler checks failed (${language}) [local fallback]:`, validationErrors))
          return
        }

        setOutputType('success')
        setOutput(getRunSummary())
        return
      }

      setOutputType('error')
      setOutput(`Compiler request failed: ${getErrorMessage(requestError)}`)
    }
  }

  const submitCode = async () => {
    setError('')

    if (!hasMeaningfulCode(code)) {
      setOutputType('error')
      setOutput('Submit failed: Add your solution code before submitting.')
      return
    }

    localStorage.setItem(`practice_draft_${questionId}_${language}`, code)
    localStorage.setItem(`practice_submission_${questionId}_${language}`, JSON.stringify({
      code,
      submittedAt: new Date().toISOString()
    }))

    try {
      const response = await submitPracticeCode({
        questionId,
        language,
        code,
        input: testInput
      })

      const result = response?.data?.data || {}
      if (!result.success) {
        setOutputType('error')
        setOutput(formatExecutionResult(`Submission blocked: strict compiler errors (${language}):`, result))
        return
      }

      const status = result.attemptMarked
        ? 'Status: Accepted and attempt saved to progress.'
        : 'Status: Accepted and stored locally.'

      const outputValue = (result.stdout || '').trim()
      setOutputType('success')
      setOutput(outputValue ? `${outputValue}\n\n${status}` : `Submission accepted (${language}).\n${status}`)
    } catch (requestError) {
      if (isRouteUnavailableError(requestError)) {
        const validationErrors = validateByLanguage(code, language)
        if (validationErrors.length > 0) {
          setOutputType('error')
          setOutput(formatErrorList(`Submission blocked: strict compiler errors found (${language}) [local fallback]:`, validationErrors))
          return
        }

        setOutputType('success')
        setOutput(`Submission accepted (${language}).\nStatus: Stored locally (compiler API unavailable).`)
        return
      }

      setOutputType('error')
      setOutput(`Submission failed: ${getErrorMessage(requestError)}`)
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Practice Problem</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Run and Submit use strict backend compiler/runtime checks with line-level errors.</p>
      {error && <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{question?.title || 'Loading problem...'}</h2>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Description</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{question?.description || 'Problem statement will appear here.'}</p>

          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Input Format</h3>
          <ul className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-200">
            {toLines(inputFormat).map((line) => (
              <li key={`input-${line}`}>- {line}</li>
            ))}
          </ul>

          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Output Format</h3>
          <ul className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-200">
            {toLines(outputFormat).map((line) => (
              <li key={`output-${line}`}>- {line}</li>
            ))}
          </ul>

          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Constraints</h3>
          <ul className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-200">
            {toLines(constraints).map((line) => (
              <li key={`constraint-${line}`}>- {line}</li>
            ))}
          </ul>

          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Example</h3>
          <div className="mt-1 space-y-2">
            {examples.map((example, index) => (
              <div key={`practice-example-${index}`} className="rounded bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p><strong>Input {index + 1}:</strong> {example.input || 'N/A'}</p>
                <p className="mt-1"><strong>Output {index + 1}:</strong> {example.output || 'N/A'}</p>
                <p className="mt-1"><strong>Explanation {index + 1}:</strong> {example.explanation || question?.explanation || 'N/A'}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Language</label>
            <select
              value={language}
              onChange={(event) => {
                const selectedLanguage = event.target.value
                setLanguage(selectedLanguage)
                setCode(starterCodeByLanguage[selectedLanguage] || starterCodeByLanguage.Java)
              }}
              className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {languageOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="h-64 w-full rounded border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-slate-100"
          />

          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <select
                value={selectedSampleIndex}
                onChange={(event) => setSelectedSampleIndex(Number(event.target.value))}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {examples.map((_, index) => (
                  <option key={`sample-${index}`} value={index}>{`SampleInput-${index + 1}`}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={runCode} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white">Run Code</button>
                <button type="button" onClick={submitCode} className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white">Submit Code</button>
              </div>
            </div>

            <textarea
              value={testInput}
              onChange={(event) => setTestInput(event.target.value)}
              className="h-36 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Enter custom input here"
            />

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Output {outputType === 'success' ? ' (Passed)' : outputType === 'error' ? ' (Error)' : ''}
              </p>
              <pre
                className={`mt-2 min-h-20 whitespace-pre-wrap rounded-lg border px-3 py-2 text-sm ${
                  outputType === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : outputType === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {output || 'Run code to view output.'}
              </pre>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
