import Anthropic from '@anthropic-ai/sdk';

// Verified from Glassdoor, Levels.fyi, Handpickedberlin (2025–2026)
const MARKET_CONTEXT = `
Berlin / European PM Salary Market Data (2026, verified):

By seniority (Berlin, gross annual EUR):
- Junior PM (0-3 yrs): €43,000–€58,000 (Glassdoor avg €48,500)
- Mid PM (3-6 yrs): €58,000–€85,000 (Glassdoor avg €65,500; market median €85,000)
- Senior PM (6-10 yrs): €80,000–€102,000 (Glassdoor avg €90,000; Levels.fyi avg €95,000)
- Lead / Principal PM (8-12 yrs): €100,000–€140,000 (Glassdoor avg €114,500)
- Head of Product (10+ yrs): €115,000–€165,000
- VP Product: €140,000–€185,000
- CPO: €160,000–€220,000+

Company type adjustments:
- Early startup (<50 employees): -10% to -15% base, equity upside
- Growth startup (50-200 employees, Series A-B): -5% to 0%
- Scale-up (200-1000 employees, Series C-D): 0% to +5%
- Enterprise (1000+ employees): +5% to +15%
- Top tech (e.g. Amazon Berlin): +40% to +80% total comp

Industry premiums over baseline:
- AI-native companies: +15% to +25%
- Fintech / crypto: +10% to +20%
- B2B SaaS: +5% to +15%
- E-commerce: 0% to +5%
- General tech: baseline

Confirmed data points:
- Levels.fyi Berlin PM median range: €79,808–€112,934
- Glassdoor Berlin Senior PM avg: €90,000
- Handpickedberlin 2025 Berlin PM median: €85,000, avg: €92,807
- Startup avg: €88,272 vs non-startup avg: €94,779
`.trim();

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

  const { cvText, jobTitle, companyName, companyIndustry, mode } = req.body || {};
  if (!cvText) return res.status(400).json({ error: 'Missing cvText.' });
  if (cvText.length > 50000) return res.status(400).json({ error: 'CV text too large.' });

  const client = new Anthropic({ apiKey });

  let prompt;

  if (mode === 'profile') {
    prompt = `You are a senior talent advisor specializing in European tech product management. You give honest, calibrated assessments — not inflated ones.

${MARKET_CONTEXT}

Analyze this candidate's CV/profile and give them a realistic, specific picture of their market value for PM roles in Berlin / Europe.

CV / Profile:
${cvText}

Return ONLY valid JSON (no markdown, no explanation):
{
  "level": "Senior PM",
  "rangeMin": 85000,
  "rangeMax": 110000,
  "midpoint": 97000,
  "confidence": "high",
  "headline": "One punchy, honest sentence on their positioning — what makes them stand out or what holds them back",
  "strengths": [
    "specific, sellable strength with evidence from their CV",
    "another concrete strength relevant to Berlin PM market",
    "third strength"
  ],
  "limitingFactors": [
    "honest factor keeping them from top of range — be specific"
  ],
  "positioning": "2-3 sentences on how they should position themselves in the Berlin market — which companies, industries, or roles are the best fit given their background",
  "tip": "One very specific, actionable negotiation tip based on their actual profile — not generic advice"
}

Rules:
- Be calibrated to real Berlin market data above
- Do not inflate numbers to make the candidate feel good
- Reference specific details from their CV
- Return ONLY JSON`;
  } else {
    // Per-role estimate
    const cvSummary = cvText.slice(0, 2000);
    prompt = `You are a senior talent advisor specializing in European tech product management.

${MARKET_CONTEXT}

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
  "label": "€85k–€112k",
  "note": "Scale-up fintech, Senior PM band"
}

Be realistic and grounded in the market data. Return ONLY JSON.`;
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(jsonStr));
  } catch (err) {
    console.error('salary-estimate error:', err);
    return res.status(500).json({ error: 'Failed to generate estimate. Please try again.' });
  }
}
