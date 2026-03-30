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

  const { cvText, jobTitle, companyName, jobSnippet, candidateName, skills } = req.body || {};
  if (!cvText || !jobTitle) return res.status(400).json({ error: 'Missing cvText or jobTitle.' });
  if (cvText.length > 50000) return res.status(400).json({ error: 'CV text too large.' });

  const client = new Anthropic({ apiKey });

  const skillsContext = skills?.length ? `\nCandidate's key skills: ${skills.join(', ')}` : '';
  const jobContext = jobSnippet
    ? `Role: ${jobTitle} at ${companyName}\nJob description:\n${jobSnippet}`
    : `Role: ${jobTitle} at ${companyName}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a career coach who writes cover letters for European tech and product roles. Your letters are read by both humans and ATS bots — they must work for both.

${jobContext}
${skillsContext}

Candidate CV:
${cvText}

Write a cover letter following these rules exactly:

STYLE:
- European tech tone: warm, direct, confident — not American over-enthusiasm
- Polished and professional, but sounds like a real person wrote it
- No clichés: never use "I am writing to express my interest", "passion for", "dynamic team", "fast-paced environment"
- Short paragraphs, natural flow

STRUCTURE (3 short paragraphs + sign-off):
1. Opening (2-3 sentences): Why THIS role at THIS company — reference something specific about the company or role
2. Value (3-4 sentences): The 2-3 most relevant experiences or achievements from their CV that directly match this role — use concrete numbers or outcomes where available
3. Close (1-2 sentences): Brief, genuine enthusiasm + availability

SIGN-OFF:
Kind regards,
${candidateName || '[Your Name]'}

ATS OPTIMIZATION:
- Naturally include key terms and skills from the job description
- Mirror the role's exact title somewhere in the letter

FORMAT:
- Total length: 200-250 words maximum
- Start directly with the opening sentence (no "Dear Hiring Team," header)
- Return ONLY the letter text, nothing else`,
    }],
  });

  const letter = message.content[0].text.trim();
  return res.status(200).json({ letter });
}
