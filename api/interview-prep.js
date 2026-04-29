import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyAuth(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = process.env.ALLOWED_ORIGIN || 'https://berlin-jobhunt.vercel.app';
  const isAllowed = origin === allowed || /^http:\/\/localhost(:\d+)?$/.test(origin);
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Sign in to use AI features.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API not configured.' });

  const { cvText, jobTitle, companyName, jobSnippet, skills } = req.body || {};
  if (!cvText || !jobTitle) return res.status(400).json({ error: 'Missing cvText or jobTitle.' });

  const cv = cvText.slice(0, 6000);
  const snippet = (jobSnippet || '').slice(0, 1500);

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `You are an experienced hiring manager and interview coach. You generate sharp, specific interview prep based on a candidate's CV and the job they're applying for. Every question is tied to something specific in the role or CV — never generic.`,
      messages: [{
        role: 'user',
        content: `Generate interview prep for this candidate.

ROLE: ${jobTitle} at ${companyName || 'the company'}
${snippet ? `JOB AD:\n${snippet}\n` : ''}CV:
${cv}
${skills?.length ? `KEY SKILLS: ${skills.join(', ')}` : ''}

Return JSON only, no markdown, no explanation:
{
  "talkingPoints": ["2-3 specific strengths from the CV that directly address what this role needs"],
  "questions": [
    { "category": "Role fit", "q": "question tied to a specific requirement in the job ad", "hint": "what the interviewer is testing" },
    { "category": "Role fit", "q": "...", "hint": "..." },
    { "category": "Behavioral", "q": "STAR-format question based on a key challenge this role involves", "hint": "..." },
    { "category": "Behavioral", "q": "...", "hint": "..." },
    { "category": "Tough", "q": "hard question based on a real gap between CV and job requirements", "hint": "how to handle it" }
  ]
}

Rules:
- 2 Role fit, 2 Behavioral, 1-2 Tough (only if genuine gaps exist — omit if strong match)
- Every question references something specific: a technology, skill, outcome, or company context
- Hints are under 12 words and practical
- talkingPoints are one sentence each, concrete, no fluff`,
      }],
    });

    const raw = message.content[0].text.trim();
    let prep;
    try {
      prep = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) prep = JSON.parse(match[0]);
      else throw new Error('Invalid response format');
    }

    return res.status(200).json(prep);
  } catch (err) {
    const msg = err?.message || 'Interview prep generation failed';
    const status = err?.status || 500;
    return res.status(status).json({ error: msg });
  }
}
