// Server-side (Node/serverless) market config — AI prompt fragments used by
// api/salary-estimate.js, api/analyze-job.js, api/cover-letter.js and
// api/extract-profile.js. Separate from src/config/markets/*.js (client UI
// strings) since these run outside the Vite client bundle and need different
// fields (prompt text, not display copy). Client requests pass `market`
// ('berlin' | 'us') in the request body; handlers look it up here.

// Verified from Glassdoor, Levels.fyi, Handpickedberlin (2025–2026)
const BERLIN_SALARY_CONTEXT = `
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

// Compiled, best-effort blend across major US tech hubs (SF Bay Area, NYC,
// Seattle) — actual pay varies a lot by city and company; worth a periodic
// spot-check against current Levels.fyi/Glassdoor US data rather than
// treated as precisely verified the way the Berlin figures above are.
const US_SALARY_CONTEXT = `
US PM Salary Market Data (2026, compiled estimate — blend of major tech hubs):

By seniority (US, blended major-hub annual base + target bonus, USD):
- Junior PM (0-3 yrs): $95,000–$130,000 (blended avg ~$110,000)
- Mid PM (3-6 yrs): $130,000–$170,000 (blended avg ~$150,000)
- Senior PM (6-10 yrs): $160,000–$210,000 (blended avg ~$185,000)
- Lead / Principal PM (8-12 yrs): $190,000–$250,000 (blended avg ~$220,000)
- Head of Product (10+ yrs): $220,000–$300,000
- VP Product: $270,000–$380,000
- CPO: $320,000–$450,000+

Company type adjustments:
- Early startup (<50 employees): -10% to -15% base, equity upside
- Growth startup (50-200 employees, Series A-B): -5% to 0%
- Scale-up (200-1000 employees, Series C-D): 0% to +5%
- Enterprise (1000+ employees): +5% to +15%
- Top tech (e.g. Meta, Google, Amazon): +50% to +100% total comp (heavy equity)

Industry premiums over baseline:
- AI-native companies: +15% to +25%
- Fintech / crypto: +10% to +20%
- B2B SaaS: +5% to +15%
- E-commerce: 0% to +5%
- General tech: baseline

Notes:
- Figures above are blended across SF Bay Area / NYC / Seattle; secondary
  hubs (Austin, Denver, Chicago) and fully-remote roles often run 10-20%
  lower than this blend.
- These are compiled estimates, not sourced from a single verified report —
  treat as directional and sanity-check against current data.
`.trim();

const MARKET_SALARY_CONTEXT = {
  berlin: BERLIN_SALARY_CONTEXT,
  us: US_SALARY_CONTEXT,
};

const MARKET_LABEL = {
  berlin: 'Berlin / Europe',
  us: 'the US',
};

const MARKET_ADVISOR_FRAMING = {
  berlin: 'European tech product management',
  us: 'US tech product management',
};

// api/analyze-job.js: how to treat location mismatch between candidate and role.
const MARKET_LOCATION_RULE = {
  berlin: 'IGNORE location entirely — assume the candidate is willing to relocate to Berlin or is already there. Never mention location as a gap or concern.',
  us: "Evaluate location fit normally against the candidate's stated preferred locations — if the role isn't remote and doesn't match, note it as a gap. Don't assume the candidate is willing to relocate unless their profile says so.",
};

// api/cover-letter.js: system-prompt persona.
const MARKET_PERSONA_LOCATION = {
  berlin: 'in Berlin',
  us: 'in the US tech industry',
};

// api/extract-profile.js: few-shot example value for preferredLocations, so
// the model isn't primed toward a specific city it shouldn't default to.
const MARKET_EXAMPLE_LOCATION = {
  berlin: 'Berlin',
  us: 'San Francisco, CA',
};

export function getMarket(market) {
  const id = MARKET_SALARY_CONTEXT[market] ? market : 'berlin';
  return {
    id,
    salaryContext: MARKET_SALARY_CONTEXT[id],
    label: MARKET_LABEL[id],
    advisorFraming: MARKET_ADVISOR_FRAMING[id],
    locationRule: MARKET_LOCATION_RULE[id],
    personaLocation: MARKET_PERSONA_LOCATION[id],
    exampleLocation: MARKET_EXAMPLE_LOCATION[id],
  };
}
