import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { getMarket } from './_markets.js';

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

  const { cvText, jobTitle, companyName, companyIndustry, mode, market } = req.body || {};
  if (!cvText) return res.status(400).json({ error: 'Missing cvText.' });
  if (cvText.length > 50000) return res.status(400).json({ error: 'CV text too large.' });

  const { salaryContext, label: marketLabel, advisorFraming, currencySymbol } = getMarket(market);

  const client = new Anthropic({ apiKey });

  let prompt;

  if (mode === 'profile') {
    const cvSummary = cvText.slice(0, 4000);
    prompt = `You are a senior talent advisor specializing in ${advisorFraming}. You give honest, calibrated assessments — not inflated ones.

${salaryContext}

Analyze this candidate's CV/profile and give them a realistic, specific picture of their market value for PM roles in ${marketLabel}.

CV / Profile:
${cvSummary}

Return ONLY valid JSON (no markdown, no explanation):
{
  "level": "Senior PM",
  "rangeMin": 85000,
  "rangeMax": 110000,
  "midpoint": 97000,
  "confidence": "high",
  "headline": "One punchy sentence on their positioning",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "limitingFactors": ["one honest limiting factor"],
  "positioning": "2-3 sentences on best-fit companies and roles in ${marketLabel}",
  "tip": "One specific, actionable negotiation tip"
}

Rules:
- Be calibrated to the real market data above
- Do not inflate numbers
- Reference specific details from their CV
- Keep strings concise — headline ≤ 15 words, each strength/factor ≤ 15 words, tip ≤ 20 words
- Return ONLY JSON`;
  } else {
    // Per-role estimate
    const cvSummary = cvText.slice(0, 2000);
    prompt = `You are a senior talent advisor specializing in ${advisorFraming}.

${salaryContext}

Given this candidate profile and a specific open role, estimate the realistic salary range this company would offer.

Candidate profile (first 2000 chars of CV):
${cvSummary}

Role: ${jobTitle || 'Product Manager'} at ${companyName || 'unknown company'}${companyIndustry ? ` (industry: ${companyIndustry})` : ''}

Infer the company type (startup/scale-up/enterprise) from the name if you know it. Apply appropriate adjustments.

Return ONLY valid JSON (no markdown):
{
  "min": 85000,
  "mid": 95000,
  "max": 112000,
  "label": "${currencySymbol}85k–${currencySymbol}112k",
  "note": "Scale-up fintech, Senior PM band"
}

Be realistic and grounded in the market data. Return ONLY JSON.`;
  }

  const maxTokens = mode === 'profile' ? 600 : 200;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: '{' },
      ],
    });

    // Prepend the prefill character we provided as assistant turn
    const raw = ('{' + message.content[0].text).trim();
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(jsonStr));
  } catch (err) {
    console.error('salary-estimate error:', err);
    return res.status(500).json({ error: 'Failed to generate estimate. Please try again.' });
  }
}
