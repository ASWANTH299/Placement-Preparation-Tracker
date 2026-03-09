const { AppError } = require('../utils/errorHandler');

const MAX_PROMPT_LENGTH = 1500;

const systemPrompt = `You are an AI placement preparation assistant for engineering students.
Provide concise, practical guidance for DSA, interviews, resume, projects, and placement strategy.
When useful, respond with short bullet points and next actions.`;

const buildFallbackReply = (message) => {
  const lower = message.toLowerCase();

  if (lower.includes('resume')) {
    return 'For your resume: 1) Keep it one page, 2) Add impact with numbers, 3) Highlight top 2 projects, 4) Keep skills honest, 5) Tailor summary for target role.';
  }

  if (lower.includes('interview') || lower.includes('hr')) {
    return 'Interview prep plan: 1) Practice 3 self-intro variants, 2) Prepare STAR stories for teamwork/conflict, 3) Solve 2 medium DSA questions daily, 4) Mock interview twice a week.';
  }

  if (lower.includes('dsa') || lower.includes('leetcode')) {
    return 'DSA plan: 1) Arrays/Strings, 2) Hashing/Two Pointers, 3) Recursion + Backtracking, 4) Trees/Graphs, 5) Dynamic Programming. Focus on pattern recognition and timed practice.';
  }

  return 'AI mode is active. Add OPENAI_API_KEY in backend env for live model responses. For now, ask me about DSA, resume, interview prep, or project ideas and I will guide you with a structured plan.';
};

const fetchOpenAIReply = async (message) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.4,
      max_tokens: 400
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(`AI service error: ${errorBody || response.statusText}`, 502, 'AI_SERVICE_ERROR');
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new AppError('AI service returned an empty response', 502, 'AI_SERVICE_ERROR');
  }

  return reply;
};

exports.chat = async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return next(new AppError('Message is required', 400, 'VALIDATION_ERROR'));
    }

    if (message.length > MAX_PROMPT_LENGTH) {
      return next(new AppError(`Message must be under ${MAX_PROMPT_LENGTH} characters`, 400, 'VALIDATION_ERROR'));
    }

    const reply = (await fetchOpenAIReply(message)) || buildFallbackReply(message);

    return res.status(200).json({
      success: true,
      data: {
        reply,
        mode: process.env.OPENAI_API_KEY ? 'live-ai' : 'fallback'
      }
    });
  } catch (error) {
    return next(error);
  }
};
