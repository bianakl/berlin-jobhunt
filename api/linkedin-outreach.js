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

  const cv = cvText.slice(0, 4000);
  const snippet = (jobSnippet || '').slice(0, 1000);

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You write LinkedIn connection request messages for job seekers. Your messages are short (under 300 characters), direct, and human. They never sound like a template. They reference one specific thing about the role or company to show the sender did their homework. No "I hope this message finds you well." No "I came across your profile." No emojis.`,
      messages: [{
        role: 'user',
        content: `Write a LinkedIn outreach message from a job seeker to a hiring manager.

ROLE: ${jobTitle} at ${companyName || 'the company'}
${snippet ? `JOB AD:\n${snippet}\n` : ''}CV SUMMARY:
${cv}
${skills?.length ? `KEY SKILLS: ${skills.join(', ')}` : ''}
SENDER NAME: ${candidateName || ''}

Rules:
- Under 300 characters (LinkedIn connection request limit)
- One specific hook — reference something real about the role or company, or one concrete thing from the CV
- End with a natural ask: "Would love to connect." or "Happy to share more about my background."
- No greeting line like "Hi [Name]," — start with the substance
- Return only the message text, nothing else`,
      }],
    });

    const message_text = message.content[0].text.trim();
    return res.status(200).json({ message: message_text });
  } catch (err) {
    const msg = err?.message || 'Outreach message generation failed';
    const status = err?.status || 500;
    return res.status(status).json({ error: msg });
  }
}
