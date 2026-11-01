import market from '../config/market';
import berlinCompanies from './companies/berlin';
import usCompanies from './companies/us';

export const ROLES = [
  {
    id: 'pm',
    label: 'Product Manager',
    short: 'PM',
    regex: /\b(product manager|head of product|vp.{0,5}product|product lead|chief product|director.{0,5}product|group product manager)\b/i,
  },
  {
    id: 'engineer',
    label: 'Software Engineer',
    short: 'Eng',
    regex: /\b(software engineer|senior engineer|staff engineer|principal engineer|backend engineer|frontend engineer|full.?stack|engineering manager|tech lead|developer)\b/i,
  },
  {
    id: 'designer',
    label: 'UX / Product Designer',
    short: 'Design',
    regex: /\b(ux designer|product designer|ui designer|ux.?ui|design lead|head of design|senior designer)\b/i,
  },
  {
    id: 'data',
    label: 'Data Scientist / Analyst',
    short: 'Data',
    regex: /\b(data scientist|data analyst|data engineer|machine learning engineer|ml engineer|analytics engineer|business intelligence)\b/i,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    short: 'Marketing',
    regex: /\b(marketing manager|growth manager|content manager|performance marketing|brand manager|head of marketing|cmo|seo)\b/i,
  },
  {
    id: 'sales',
    label: 'Sales / BizDev',
    short: 'Sales',
    regex: /\b(account executive|sales manager|business development|account manager|sales engineer|head of sales|vp.{0,5}sales)\b/i,
  },
];

export const STAGES = [
  { id: 'saved', label: 'Saved', emoji: '📌', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
  { id: 'applied', label: 'Applied', emoji: '📬', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  { id: 'interview', label: 'Interview', emoji: '💬', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
  { id: 'offer', label: 'Offer', emoji: '🎉', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  { id: 'company_rejected', label: 'They passed', emoji: '🚫', color: '#ef4444', bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.15)', terminal: true },
  { id: 'rejected', label: 'Archived', emoji: '👋', color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)', terminal: true },
];

export const INDUSTRIES = [
  'AI / ML', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'SaaS / B2B', 'Gaming', 'Media & Content', 'Mobility', 'Climate Tech',
  'Cybersecurity', 'Developer Tools', 'Consumer Apps', 'Deep Tech', 'Other',
];

export const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500–1000', '1000+'];

const _seedCompanies = market.id === 'us' ? usCompanies : berlinCompanies;

export const seedCompanies = _seedCompanies.map((c) => ({
  linkedinUrl: '',
  connections: '',
  referral: false,
  viaForm: false,
  email: '',
  ...c,
}));

// Sanitized version for new users — no personal notes, favorites, or tracking data
export const starterPackCompanies = _seedCompanies.map((c) => ({
  id: c.id,
  name: c.name,
  website: c.website || '',
  industry: c.industry,
  size: c.size,
  atsType: c.atsType || '',
  atsSlug: c.atsSlug || '',
  // personal fields — all cleared
  notes: '',
  favorite: false,
  referral: false,
  viaForm: false,
  email: '',
  connections: '',
  linkedinUrl: '',
  positions: [],
  atsCheckedAt: null,
}));

export const seedJobs = [];
