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

  const { cvText, jobTitle, companyName, jobSnippet, candidateName, skills } = req.body || {};
  if (!cvText || !jobTitle) return res.status(400).json({ error: 'Missing cvText or jobTitle.' });

  const cv = cvText.slice(0, 6000);
  const snippet = (jobSnippet || '').slice(0, 1500);

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `You are a senior product leader in Berlin who occasionally helps colleagues write job applications. You write the way you speak: clear, specific, grounded. You never write anything you wouldn't say in a real conversation, and you never claim experience that isn't backed by what's on the candidate's CV. Your letters are 200–250 words, three paragraphs, no greeting line, signed off with "Kind regards,".`,
      messages: [{
        role: 'user',
        content: `Write a cover letter for this application.

ROLE: ${jobTitle} at ${companyName || 'the company'}
${snippet ? `JOB AD:\n${snippet}\n` : ''}CV:
${cv}
${skills?.length ? `KEY SKILLS: ${skills.join(', ')}` : ''}

Three paragraphs:
1. Why this specific role at this specific company — one concrete detail from the job ad or what you know about them
2. Two or three experiences from the CV that directly match what they're asking for — use real numbers or outcomes where the CV has them
3. One sentence close, genuine but not effusive

Sign off: Kind regards,\n${candidateName || '[Your Name]'}

Only use what's in the CV — nothing else. No "I am writing to express my interest." No "passion for." No clichés.
Return only the letter.`,
      }],
    });

    const letter = message.content[0].text.trim();
    return res.status(200).json({ letter });
  } catch (err) {
    const msg = err?.message || 'Cover letter generation failed';
    const status = err?.status || 500;
    return res.status(status).json({ error: msg });
  }
}
