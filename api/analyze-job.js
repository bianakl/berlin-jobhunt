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

  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No API key provided.' });

  const { cvText, jobTitle, companyName, jobSnippet } = req.body || {};
  if (!cvText || !jobTitle) return res.status(400).json({ error: 'Missing cvText or jobTitle.' });
  if (cvText.length > 50000) return res.status(400).json({ error: 'CV text too large.' });

  const client = new Anthropic({ apiKey });

  const jobContext = jobSnippet
    ? `Role: ${jobTitle} at ${companyName}\nJob description excerpt: ${jobSnippet}`
    : `Role: ${jobTitle} at ${companyName}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are a job compatibility analyzer. Given a candidate's CV and a job role, assess the fit.

${jobContext}

Candidate CV:
${cvText}

Return ONLY valid JSON (no markdown, no explanation):
{
  "score": 75,
  "summary": "One sentence honest assessment of fit",
  "strengths": ["specific strength 1", "specific strength 2"],
  "gaps": ["specific gap 1"]
}

Score 0-100. Be specific and honest. Return ONLY the JSON.`,
    }],
  });

  const raw = message.content[0].text.trim();
  try {
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(jsonStr));
  } catch {
    return res.status(500).json({ error: 'Failed to parse analysis response.' });
  }
}
