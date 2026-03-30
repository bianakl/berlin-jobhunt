import Anthropic from '@anthropic-ai/sdk';

function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || null;
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', allowed || origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (allowed) res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY || req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'No API key provided.' });

  const { cvText, jobTitle, companyName, jobSnippet, skills } = req.body || {};
  if (!cvText || !jobTitle) return res.status(400).json({ error: 'Missing cvText or jobTitle.' });
  if (cvText.length > 50000) return res.status(400).json({ error: 'CV text too large.' });

  const client = new Anthropic({ apiKey });

  const jobContext = jobSnippet
    ? `Role: ${jobTitle} at ${companyName}\nJob description:\n${jobSnippet}`
    : `Role: ${jobTitle} at ${companyName}`;
  const skillsContext = skills?.length ? `\nCandidate's key skills: ${skills.join(', ')}` : '';

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a sharp, honest career advisor helping a PM evaluate whether to pursue a specific role. Be direct, specific, and genuinely useful — not generic.

${jobContext}${skillsContext}

Candidate CV:
${cvText}

Analyze the fit and return ONLY valid JSON (no markdown, no explanation):
{
  "score": 78,
  "verdict": "strong match",
  "summary": "2-3 sentence honest assessment — what makes this person a good or poor fit for THIS specific role",
  "strengths": [
    "specific, concrete strength directly relevant to this role",
    "another specific strength with evidence from their CV"
  ],
  "gaps": [
    "specific gap or missing requirement for this role"
  ],
  "highlights": [
    "what to lead with in the cover letter or first conversation",
    "specific experience or achievement to emphasize"
  ],
  "watchouts": [
    "one honest concern the hiring manager might raise"
  ],
  "compatibility": {
    "roleMatch": 4,
    "skillsMatch": 3,
    "seniorityFit": 4,
    "industryFit": 3,
    "overallFit": 4
  }
}

Scoring rules:
- score: 0-100 overall fit
- verdict: one of "strong match" | "good match" | "possible match" | "stretch" | "not a fit"
- compatibility values: 1-5 stars
- Be specific — reference actual details from their CV and the job description
- Do not sugarcoat gaps
- Return ONLY the JSON`,
      }],
    });

    const raw = message.content[0].text.trim();
    try {
      const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      return res.status(200).json(JSON.parse(jsonStr));
    } catch {
      return res.status(500).json({ error: 'Failed to parse analysis response.' });
    }
  } catch (err) {
    const msg = err?.message || 'Analysis failed';
    const status = err?.status || 500;
    return res.status(status).json({ error: msg });
  }
}
