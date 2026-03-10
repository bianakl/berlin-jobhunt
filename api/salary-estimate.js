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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No API key provided.' });

  const { cvText, jobTitle, companyName, companyIndustry, mode } = req.body || {};
  if (!cvText) return res.status(400).json({ error: 'Missing cvText.' });

  const client = new Anthropic({ apiKey });

  let prompt;

  if (mode === 'profile') {
    prompt = `You are a senior talent advisor specializing in European tech product management.

${MARKET_CONTEXT}

Analyze this candidate's CV/profile and assess their realistic market value for PM roles in Berlin / Europe.

CV / Profile:
${cvText}

Return ONLY valid JSON (no markdown, no explanation):
{
  "level": "Senior PM",
  "rangeMin": 85000,
  "rangeMax": 110000,
  "midpoint": 97000,
  "confidence": "high",
  "headline": "One punchy sentence on their positioning and leverage",
  "strengths": ["specific sellable strength 1", "specific sellable strength 2", "specific sellable strength 3"],
  "limitingFactors": ["one realistic factor keeping them from the top of the range"],
  "tip": "One actionable negotiation tip specific to their profile"
}

Be calibrated to real Berlin market data. Do not inflate. Return ONLY JSON.`;
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
    return res.status(500).json({ error: 'Failed to generate estimate.', detail: err.message });
  }
}
