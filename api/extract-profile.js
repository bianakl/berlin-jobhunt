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

  const { cvText, cvBase64 } = req.body || {};
  if (!cvText && !cvBase64) return res.status(400).json({ error: 'No CV content provided.' });
  if (cvText && cvText.length > 50000) return res.status(400).json({ error: 'CV text too large.' });
  if (cvBase64 && cvBase64.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'PDF too large.' });

  const client = new Anthropic({ apiKey });

  const PROMPT = `You are a CV parser. Extract structured profile information and return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name": "Full Name or empty string",
  "currentRole": "Most recent job title or empty string",
  "skills": ["skill1", "skill2"],
  "yearsExperience": "5",
  "preferredIndustries": [],
  "salaryMin": "",
  "salaryMax": "",
  "preferredLocations": "Berlin",
  "bio": "2-3 sentence professional summary"
}

Rules:
- skills: up to 20 most relevant skills, tools, and methodologies from the CV
- currentRole: exact title from the most recent job
- yearsExperience: total professional years as a plain number string
- bio: write a concise professional summary based on the CV content
- Return ONLY the JSON object, nothing else.`;

  let content;
  if (cvBase64) {
    content = [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: cvBase64 } },
      { type: 'text', text: PROMPT },
    ];
  } else {
    content = `${cvText}\n\n---\n\n${PROMPT}`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    });

    const raw = message.content[0].text.trim();
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const profile = JSON.parse(jsonStr);
    return res.status(200).json(profile);
  } catch (err) {
    console.error('extract-profile error:', err);
    return res.status(500).json({ error: 'Profile extraction failed. Please try again.' });
  }
}
