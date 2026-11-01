// Relocation guide content for international tech job seekers moving to the US.
// English-only (no `de` block) — Relocation.jsx falls back to `en` when a
// translation is missing. Facts compiled from official sources; visa caps,
// fees and thresholds change yearly — always confirm current figures on the
// linked .gov sites before relying on them.

const relocationTopics = [
  {
    id: 'visas',
    icon: 'Stamp',
    en: {
      title: 'Visa sponsorship',
      tagline: 'How non-US citizens get the right to work in the US',
      sections: [
        {
          heading: 'H-1B — the standard tech route',
          bullets: [
            'Specialty-occupation visa, sponsored by an employer. Requires at least a bachelor\'s degree (or equivalent experience) in a field related to the role.',
            'Subject to an annual lottery: ~85,000 new visas/year (65,000 regular cap + 20,000 reserved for US master\'s-degree holders). Employers register candidates in March; selected registrants file the full petition.',
            'Valid 3 years initially, renewable to 6 total. Changing employers requires a new H-1B transfer petition (does not reset the clock).',
            'Not every company sponsors — check the job posting or ask directly; sponsorship is a real, employer-by-employer decision, not guaranteed.',
          ],
        },
        {
          heading: 'O-1 — "extraordinary ability"',
          bullets: [
            'No annual cap and no lottery, but a high evidentiary bar: awards, media coverage, high salary relative to the field, leadership roles, published or widely-cited work.',
            'More commonly pursued by senior or notable candidates than by early-career applicants.',
          ],
        },
        {
          heading: 'F-1 OPT / STEM OPT — for recent US graduates',
          bullets: [
            'International students on an F-1 visa can work for 12 months after graduating (standard OPT) without needing H-1B first.',
            'STEM-degree holders get a further 24-month extension (STEM OPT), giving employers more chances to enter the H-1B lottery before it\'s needed.',
          ],
        },
        {
          heading: 'Green card (employment-based)',
          bullets: [
            'The longer-term path to permanent residency, usually pursued after a few years on H-1B. Involves PERM labor certification and can take years — especially for applicants born in countries with large backlogs (India, China).',
          ],
        },
        {
          heading: 'Good to know',
          bullets: [
            'Canadian and Mexican citizens have a separate, lottery-free route (TN visa) under USMCA.',
            'Visa rules and caps change; always check current numbers on USCIS before planning around them.',
          ],
        },
      ],
      sources: [
        { label: 'USCIS — H-1B specialty occupations', url: 'https://www.uscis.gov/working-in-the-united-states/h-1b-specialty-occupations' },
        { label: 'USCIS — O-1 extraordinary ability', url: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/o-1-visa-individuals-with-extraordinary-ability-or-achievement' },
        { label: 'USCIS — employment-based green cards', url: 'https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-employment-based-immigrants' },
      ],
    },
  },
  {
    id: 'ssn',
    icon: 'Fingerprint',
    en: {
      title: 'Social Security Number (SSN)',
      tagline: 'The ID you need to get paid and build a financial life',
      sections: [
        {
          heading: 'Why you need one',
          bullets: [
            'Required to be paid legally by a US employer, to open most bank accounts and credit products, and to file taxes.',
            'Most newcomers apply once they\'ve entered the US in a valid work-authorized status (e.g. H-1B, O-1, OPT/EAD).',
          ],
        },
        {
          heading: 'How to apply',
          bullets: [
            'Apply in person at a Social Security Administration (SSA) office — bring your passport, visa/I-797 approval or EAD card, and Form I-94 (arrival record).',
            'The card itself typically arrives by mail a few weeks after your appointment.',
            'Many employers can start you working while the SSN is pending — confirm the process with HR before your start date.',
          ],
        },
        {
          heading: 'If you\'re not eligible for an SSN',
          bullets: [
            'An ITIN (Individual Taxpayer Identification Number) exists for people who need to file taxes but don\'t qualify for an SSN — not usually relevant for employer-sponsored workers.',
          ],
        },
      ],
      sources: [
        { label: 'SSA — Social Security numbers for noncitizens', url: 'https://www.ssa.gov/number-card' },
        { label: 'SSA — Application for a Social Security Card (Form SS-5)', url: 'https://www.ssa.gov/forms/ss-5.html' },
      ],
    },
  },
  {
    id: 'health',
    icon: 'HeartPulse',
    en: {
      title: 'Health insurance',
      tagline: 'No universal public system — coverage is employer or marketplace',
      sections: [
        {
          heading: 'Employer-sponsored coverage — the default',
          bullets: [
            'Most full-time tech jobs offer a health plan starting day one or after a short waiting period, usually with the company covering most of the premium.',
            'Plan quality varies a lot between employers — ask about the deductible, premium split, and whether dental/vision are included when you\'re evaluating an offer.',
          ],
        },
        {
          heading: 'Key US-specific terms',
          bullets: [
            'Deductible: what you pay out of pocket before insurance starts covering costs.',
            'Copay / coinsurance: your share of the cost per visit or procedure after the deductible is met.',
            'In-network vs. out-of-network: using an out-of-network provider usually costs much more.',
            'HSA/FSA: tax-advantaged accounts, often paired with high-deductible plans, for medical expenses.',
          ],
        },
        {
          heading: 'If you\'re between jobs or self-employed',
          bullets: [
            'COBRA lets you temporarily continue a former employer\'s plan — but you pay the full premium plus an admin fee, so it\'s expensive.',
            'The ACA Marketplace (healthcare.gov) is the alternative for buying your own plan, with income-based subsidies for many applicants.',
          ],
        },
      ],
      sources: [
        { label: 'HealthCare.gov — the official ACA marketplace', url: 'https://www.healthcare.gov/' },
        { label: 'HealthCare.gov — glossary (deductible, copay, etc.)', url: 'https://www.healthcare.gov/glossary/deductible/' },
      ],
    },
  },
  {
    id: 'banking',
    icon: 'Landmark',
    en: {
      title: 'Banking & credit history',
      tagline: 'Opening an account, and starting credit from zero',
      sections: [
        {
          heading: 'Opening an account',
          bullets: [
            'Major banks (Chase, Bank of America, Wells Fargo) and several newcomer-friendly digital banks accept an SSN (or ITIN), proof of address, and ID.',
            'Some banks let you start an account with limited functionality before your SSN arrives — ask directly.',
          ],
        },
        {
          heading: 'Credit history doesn\'t transfer',
          bullets: [
            'Your credit history from abroad doesn\'t carry over — you start at zero in the US system, regardless of your financial track record elsewhere.',
            'Credit history matters for apartment applications, car loans, and sometimes even job background checks, so it\'s worth starting deliberately.',
            'Common starter moves: a secured credit card, becoming an authorized user on a trusted person\'s card, or a credit card product designed for newcomers with no US history.',
          ],
        },
        {
          heading: 'The credit score',
          bullets: [
            'FICO scores run roughly 300–850 and are tracked by three bureaus (Experian, Equifax, TransUnion) — landlords and lenders check these, not a single national registry like SCHUFA.',
          ],
        },
      ],
      sources: [
        { label: 'Consumer Financial Protection Bureau — credit reports & scores', url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/' },
        { label: 'myFICO — how credit scores work', url: 'https://www.myfico.com/credit-education/credit-scores' },
      ],
    },
  },
  {
    id: 'housing',
    icon: 'KeyRound',
    en: {
      title: 'Apartment hunting',
      tagline: 'Applications run on income, credit, and sometimes a guarantor',
      sections: [
        {
          heading: 'What landlords ask for',
          bullets: [
            'Proof of income — often 2.5–3× the monthly rent — plus a credit check and sometimes a background check.',
            'With no US credit or income history yet, landlords may ask for a US-based guarantor, extra months of rent upfront, or a larger deposit.',
          ],
        },
        {
          heading: 'Deposits and fees vary a lot by state',
          bullets: [
            'Security deposit limits are set at the state (not federal) level — some states cap deposits at 1–2 months\' rent, others have no cap at all. Check local tenant law.',
            'Some markets (notably New York City) commonly charge a broker fee that can equal a full month\'s rent or more — budget for this on top of the deposit.',
          ],
        },
        {
          heading: 'Where to search',
          bullets: [
            'Zillow and Apartments.com are the broadest listing sites; StreetEasy is the go-to for New York City specifically.',
            'Be cautious on Craigslist and similar open listing boards — never pay or wire money before an in-person or verified video viewing.',
          ],
        },
      ],
      sources: [
        { label: 'USA.gov — renting and leases', url: 'https://www.usa.gov/renting-and-leases' },
        { label: 'HUD — tenant rights', url: 'https://www.hud.gov/topics/rental_assistance/tenantrights' },
      ],
    },
  },
  {
    id: 'taxes',
    icon: 'Receipt',
    en: {
      title: 'Taxes — the basics',
      tagline: 'Federal, state, and what comes out of your paycheck',
      sections: [
        {
          heading: 'Federal income tax',
          bullets: [
            'Progressive rate, filed annually with the IRS (Form 1040), typically due April 15 for the prior calendar year.',
            'New employees fill out a Form W-4 with their employer to set withholding.',
          ],
        },
        {
          heading: 'State income tax varies a lot',
          bullets: [
            'Unlike federal tax, state income tax is set independently by each state — several states (Texas, Washington, Florida, Nevada, and others) have no state income tax at all, while others (California, New York) add a significant amount on top of federal tax.',
            'Where you live changes your real take-home pay substantially — worth factoring into offer comparisons across cities.',
          ],
        },
        {
          heading: 'What gets withheld from each paycheck',
          bullets: [
            'Federal income tax (per your W-4), plus FICA taxes: Social Security (6.2%, up to an annual wage cap) and Medicare (1.45%) — your employer matches both.',
            'State and, in some cities, local income tax may also be withheld depending on where you work.',
          ],
        },
        {
          heading: 'Your first year can be tricky',
          bullets: [
            'Residency status for tax purposes (resident vs. nonresident alien) depends on visa type and time in the US, and affects which forms and treaty benefits apply.',
            'Many newcomers use tax software built for this (or a CPA familiar with newcomer/visa situations) for their first US filing rather than figuring it out from scratch.',
          ],
        },
      ],
      sources: [
        { label: 'IRS — individuals', url: 'https://www.irs.gov/individuals' },
        { label: 'IRS — Form W-4', url: 'https://www.irs.gov/forms-pubs/about-form-w-4' },
        { label: 'IRS — federal income tax rates and brackets', url: 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets' },
      ],
    },
  },
];

export default relocationTopics;
