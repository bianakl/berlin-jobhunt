import { useState, useRef } from 'react';
import { authHeader } from '../lib/authHeader';
import { User, Plus, X, Save, Upload, Key, Sparkles, Loader2, CheckCircle, TrendingUp, RefreshCw, Trash2, Sun, Moon, Cloud, LogOut, ExternalLink, Globe } from 'lucide-react';
import { INDUSTRIES } from '../data/seed';

const PORTFOLIO_PROJECTS = [
  {
    title: 'TamaGotchi 2.0',
    description: 'A web-based virtual pet. Feed, play with, and keep your digital companion alive.',
    url: 'https://tamagotchi-app-five.vercel.app/',
    screenshot: '/portfolio/tamagotchi.png',
    tags: ['React', 'Game', 'Web App'],
    accent: '#6366f1',
  },
  {
    title: 'pooping.com',
    description: 'Everyone does it. Health, humor, gear, and community for every bathroom moment.',
    url: 'https://pooping-com.vercel.app/login',
    screenshot: '/portfolio/pooping.png',
    tags: ['Next.js', 'Community', 'Health'],
    accent: '#f59e0b',
  },
  {
    title: 'Recipe Finder',
    description: 'Discover recipes worldwide, plan weekly meals, build shopping lists, and track nutrition.',
    url: 'https://recipe-finder-two-red.vercel.app/#saved',
    screenshot: '/portfolio/recipe-finder.png',
    tags: ['React', 'PWA', 'Supabase'],
    accent: '#ef4444',
  },
];

const inputStyle = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border-2)',
  borderRadius: 8,
  color: 'var(--text-1)',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: 'var(--text-4)' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function Profile({ profile, onUpdate, dark, onToggleDark, syncUser, syncStatus, onSyncRequest, onSignOut, onSyncNow }) {
  const [form, setForm] = useState({ ...profile });
  const [skillInput, setSkillInput] = useState('');
  const [saved, setSaved] = useState(false);

  // Market value state
  const [marketValue, setMarketValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scout-market-value') || 'null'); } catch { return null; }
  });
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState('');

  // AI / CV state
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('scout-claude-key') || '');
  const [cvFileName, setCvFileName] = useState(() => localStorage.getItem('scout-cv-name') || '');
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  // Sync card state
  const [syncEmail, setSyncEmail] = useState('');
  const [syncSent, setSyncSent] = useState(false);
  const [syncEmailError, setSyncEmailError] = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    set('skills', [...form.skills, s]);
    setSkillInput('');
  };

  const removeSkill = (sk) => set('skills', form.skills.filter((s) => s !== sk));

  const toggleIndustry = (ind) => {
    const current = form.preferredIndustries || [];
    if (current.includes(ind)) {
      set('preferredIndustries', current.filter((i) => i !== ind));
    } else {
      set('preferredIndustries', [...current, ind]);
    }
  };

  const handleAnalyzeWorth = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { setMarketError('Upload your CV first (AI profile extraction section below).'); return; }
    setMarketLoading(true);
    setMarketError('');
    try {
      const res = await fetch('/api/salary-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ cvText, mode: 'profile' }),
      });
      const data = await res.json();
      if (data.error) { setMarketError(data.error); }
      else {
        setMarketValue(data);
        localStorage.setItem('scout-market-value', JSON.stringify(data));
      }
    } catch (err) {
      setMarketError(err.message);
    }
    setMarketLoading(false);
  };

  const handleSave = () => {
    onUpdate(form);
    localStorage.setItem('scout-claude-key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFile = async (file) => {
    if (!file) return;
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      setExtractMsg('File too large (max 5 MB).');
      return;
    }

    setCvFileName(file.name);
    localStorage.setItem('scout-cv-name', file.name);
    setExtractMsg('');

    await extractFromFile(file);
  };

  const extractFromFile = async (file) => {
    setExtracting(true);
    setExtractMsg('Reading CV...');
    try {
      let body;
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        localStorage.setItem('scout-cv-text', text);
        body = { cvText: text };
      } else {
        // PDF → base64
        const b64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        localStorage.setItem('scout-cv-b64', b64);
        // Also try to extract as text for analyze-job (send plain text separately)
        body = { cvBase64: b64 };
      }

      setExtractMsg('Extracting profile with AI...');
      const res = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setExtractMsg(`Error: ${data.error}`);
      } else {
        // Merge extracted data into form (keep existing non-empty values)
        const merged = {
          ...form,
          name: data.name || form.name,
          currentRole: data.currentRole || form.currentRole,
          skills: data.skills?.length ? data.skills : form.skills,
          yearsExperience: data.yearsExperience || form.yearsExperience,
          preferredIndustries: data.preferredIndustries?.length ? data.preferredIndustries : form.preferredIndustries,
          salaryMin: data.salaryMin || form.salaryMin,
          salaryMax: data.salaryMax || form.salaryMax,
          bio: data.bio || form.bio,
        };
        setForm(merged);
        // Store readable CV text for job analysis (never store raw JSON)
        if (body.cvText) {
          localStorage.setItem('scout-cv-text', body.cvText);
        } else {
          const cvSummary = [
            data.name ? `Name: ${data.name}` : '',
            data.currentRole ? `Current Role: ${data.currentRole}` : '',
            data.yearsExperience ? `Years of Experience: ${data.yearsExperience}` : '',
            data.skills?.length ? `Skills: ${data.skills.join(', ')}` : '',
            data.preferredIndustries?.length ? `Industries: ${data.preferredIndustries.join(', ')}` : '',
            data.bio ? `Summary: ${data.bio}` : '',
          ].filter(Boolean).join('\n');
          localStorage.setItem('scout-cv-text', cvSummary);
        }
        // Clean up base64 blob — no longer needed after extraction
        localStorage.removeItem('scout-cv-b64');
        // Auto-save so CV is synced without requiring manual Save click
        onUpdate(merged);
        setExtractMsg('Profile extracted and saved!');
      }
    } catch (err) {
      setExtractMsg(`Error: ${err.message}`);
    }
    setExtracting(false);
  };

  const handleExtractClick = async () => {
    // Re-run extraction using stored file
    const b64 = localStorage.getItem('scout-cv-b64');
    const text = localStorage.getItem('scout-cv-text');
    if (!b64 && !text) {
      setExtractMsg('Upload a CV file first.');
      return;
    }
    setExtracting(true);
    setExtractMsg('Extracting profile with AI...');
    try {
      const body = b64 ? { cvBase64: b64 } : { cvText: text };
      const res = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setExtractMsg(`Error: ${data.error}`);
      } else {
        const merged = {
          ...form,
          name: data.name || form.name,
          currentRole: data.currentRole || form.currentRole,
          skills: data.skills?.length ? data.skills : form.skills,
          yearsExperience: data.yearsExperience || form.yearsExperience,
          preferredIndustries: data.preferredIndustries?.length ? data.preferredIndustries : form.preferredIndustries,
          salaryMin: data.salaryMin || form.salaryMin,
          salaryMax: data.salaryMax || form.salaryMax,
          bio: data.bio || form.bio,
        };
        setForm(merged);
        if (!text) {
          const cvSummary = [
            data.name ? `Name: ${data.name}` : '',
            data.currentRole ? `Current Role: ${data.currentRole}` : '',
            data.yearsExperience ? `Years of Experience: ${data.yearsExperience}` : '',
            data.skills?.length ? `Skills: ${data.skills.join(', ')}` : '',
            data.preferredIndustries?.length ? `Industries: ${data.preferredIndustries.join(', ')}` : '',
            data.bio ? `Summary: ${data.bio}` : '',
          ].filter(Boolean).join('\n');
          localStorage.setItem('scout-cv-text', cvSummary);
        }
        localStorage.removeItem('scout-cv-b64');
        onUpdate(merged);
        setExtractMsg('Profile extracted and saved!');
      }
    } catch (err) {
      setExtractMsg(`Error: ${err.message}`);
    }
    setExtracting(false);
  };

  const handleEnableSync = async () => {
    setSyncEmailError('');
    if (!syncEmail.trim() || !syncEmail.includes('@')) {
      setSyncEmailError('Enter a valid email address.');
      return;
    }
    try {
      await onSyncRequest(syncEmail.trim());
      setSyncSent(true);
    } catch {
      setSyncEmailError('Failed to send link. Try again.');
    }
  };

  const handleClearData = () => {
    if (!window.confirm('This will permanently delete all your Scout data: jobs, companies, profile, and API key. Continue?')) return;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('scout-')) localStorage.removeItem(k);
    });
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Profile</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
            Your profile powers compatibility scoring on job cards
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ background: saved ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Save size={13} />
          {saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Basic info card */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Basic info</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Your name">
              <input
                placeholder="Biana K."
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
            </Field>
            <Field label="Current role">
              <input
                placeholder="Senior Product Manager"
                value={form.currentRole}
                onChange={(e) => set('currentRole', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedinUrl}
                onChange={(e) => set('linkedinUrl', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
            </Field>
            <Field label="CV / Portfolio URL">
              <input
                type="url"
                placeholder="https://..."
                value={form.cvUrl}
                onChange={(e) => set('cvUrl', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
            </Field>
            <Field label="Years of experience">
              <input
                type="number"
                min="0"
                max="40"
                placeholder="5"
                value={form.yearsExperience}
                onChange={(e) => set('yearsExperience', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
            </Field>
            <Field label="Preferred locations" hint="— comma-separated">
              <input
                placeholder="Berlin, Remote"
                value={form.preferredLocations}
                onChange={(e) => set('preferredLocations', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
            </Field>
            <div className="col-span-2">
              <Field label="Bio / Summary">
                <textarea
                  placeholder="Brief summary of your background, what you're looking for..."
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Portfolio card */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Portfolio</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8' }}>3 projects</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PORTFOLIO_PROJECTS.map((project) => (
              <a
                key={project.url}
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl overflow-hidden border transition-all"
                style={{ borderColor: 'var(--border-2)', textDecoration: 'none', display: 'block' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = project.accent; e.currentTarget.style.boxShadow = `0 4px 20px ${project.accent}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Screenshot */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', background: 'var(--surface-2)' }}>
                  <img
                    src={project.screenshot}
                    alt={project.title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    style={{ display: 'block' }}
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: `${project.accent}cc` }}
                  >
                    <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                      <ExternalLink size={13} /> View project
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{project.title}</h3>
                    <ExternalLink size={10} style={{ color: 'var(--text-5)', flexShrink: 0, marginTop: 2 }} />
                  </div>
                  <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--text-4)' }}>{project.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${project.accent}14`, color: project.accent }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Skills card */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Skills</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>
            Add skills that match job tags for compatibility scoring
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.skills.map((sk) => (
              <span
                key={sk}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                {sk}
                <button onClick={() => removeSkill(sk)} style={{ color: '#a5b4fc' }}>
                  <X size={10} />
                </button>
              </span>
            ))}
            {form.skills.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--text-5)' }}>No skills added yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Add a skill (e.g. B2B, AI, fintech)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-1)', outline: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            />
            <button
              onClick={addSkill}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>

        {/* Market Value card */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} style={{ color: '#6366f1' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Your market value</h2>
            </div>
            <button
              onClick={handleAnalyzeWorth}
              disabled={marketLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: marketLoading ? 'var(--surface-5)' : 'rgba(99,102,241,0.08)', color: marketLoading ? 'var(--text-4)' : '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              {marketLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              {marketLoading ? 'Analyzing…' : marketValue ? 'Re-analyze' : 'Analyze my worth'}
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
            Based on your CV and current Berlin PM market data (Glassdoor, Levels.fyi, Handpickedberlin 2026)
          </p>

          {marketError && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{marketError}</p>}

          {marketValue && !marketLoading && (
            <div className="rounded-xl p-4 fade-in" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.05), rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.12)' }}>
              {/* Range + level */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
                    €{Math.round(marketValue.rangeMin / 1000)}k–€{Math.round(marketValue.rangeMax / 1000)}k
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>gross annual · Berlin market</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                    {marketValue.level}
                  </span>
                  {marketValue.confidence && (
                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>{marketValue.confidence} confidence</div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((marketValue.midpoint - 40000) / (220000 - 40000) * 100))}%`, background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }} />
              </div>

              {/* Headline */}
              {marketValue.headline && (
                <p className="text-xs italic mb-3" style={{ color: 'var(--text-2)' }}>"{marketValue.headline}"</p>
              )}

              {/* Strengths + limiting factors */}
              <div className="flex flex-col gap-1 mb-3">
                {marketValue.strengths?.map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{s}
                  </div>
                ))}
                {marketValue.limitingFactors?.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-4)' }}>
                    <span style={{ flexShrink: 0 }}>↑</span>{f}
                  </div>
                ))}
              </div>

              {/* Positioning */}
              {marketValue.positioning && (
                <div className="rounded-lg px-3 py-2.5 text-xs mb-2" style={{ background: 'rgba(99,102,241,0.06)', color: '#0d5c55', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <span className="font-semibold">Positioning: </span>{marketValue.positioning}
                </div>
              )}

              {/* Tip */}
              {marketValue.tip && (
                <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(245,158,11,0.07)', color: '#92400e', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <span className="font-semibold">Negotiation tip: </span>{marketValue.tip}
                </div>
              )}
            </div>
          )}

          {!marketValue && !marketLoading && (
            <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
              <TrendingUp size={24} style={{ color: 'var(--border)', margin: '0 auto 8px' }} />
              <p className="text-xs" style={{ color: 'var(--text-4)' }}>Upload your CV and click "Analyze my worth" to see your Berlin market value</p>
            </div>
          )}
        </div>

        {/* Salary + Industries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Salary */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Salary expectations</h2>
            <div className="flex flex-col gap-3">
              <Field label="Minimum (EUR/yr)">
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="70000"
                  value={form.salaryMin}
                  onChange={(e) => set('salaryMin', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                />
              </Field>
              <Field label="Maximum (EUR/yr)">
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="110000"
                  value={form.salaryMax}
                  onChange={(e) => set('salaryMax', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                />
              </Field>
            </div>
          </div>

          {/* Preferred industries */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Preferred industries</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-4)' }}>Select all that interest you</p>
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
              {INDUSTRIES.map((ind) => {
                const active = (form.preferredIndustries || []).includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: active ? 'rgba(99,102,241,0.1)' : 'var(--surface-5)',
                      color: active ? '#6366f1' : 'var(--text-3)',
                      border: `1px solid ${active ? 'rgba(13,148,136,0.3)' : 'transparent'}`,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI + CV Upload card — advanced, lives at the bottom */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>AI profile extraction</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
            Upload your CV and let Claude fill in your profile automatically. Also powers job compatibility analysis.
          </p>

          {/* API Key */}
          <div className="mb-4">
            <Field label="Anthropic API key" hint="— stored locally, never sent anywhere else">
              <div className="relative">
                <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-2)';
                    localStorage.setItem('scout-claude-key', apiKey);
                  }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>
                Get a key at console.anthropic.com.
              </p>
            </Field>
          </div>

          {/* CV Upload */}
          <div
            className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all mb-3"
            style={{ borderColor: dragging ? '#6366f1' : 'var(--border)', background: dragging ? 'rgba(13,148,136,0.04)' : 'var(--surface-2)' }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <Upload size={20} style={{ color: 'var(--text-5)', margin: '0 auto 8px' }} />
            {cvFileName ? (
              <div>
                <p className="text-xs font-medium" style={{ color: '#6366f1' }}>{cvFileName}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>Click to replace</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Drop your CV here or click to upload</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>PDF or TXT · max 5 MB</p>
              </div>
            )}
          </div>

          {/* Extract button + message */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtractClick}
              disabled={extracting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: extracting ? 'var(--text-4)' : 'linear-gradient(135deg, #6366f1, #4f46e5)', cursor: extracting ? 'not-allowed' : 'pointer' }}
            >
              {extracting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {extracting ? 'Extracting...' : 'Extract profile from CV'}
            </button>
            {extractMsg && (
              <p className="text-xs flex-1" style={{ color: extractMsg.startsWith('Error') ? '#ef4444' : extractMsg.includes('extracted') ? '#22c55e' : 'var(--text-3)' }}>
                {extractMsg.includes('extracted') && <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />}
                {extractMsg}
              </p>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{dark ? 'Dark mode' : 'Light mode'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Applies to all views</p>
            </div>
            <button
              onClick={onToggleDark}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-2)' }}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
              {dark ? 'Switch to light' : 'Switch to dark'}
            </button>
          </div>
        </div>

        {/* Sync card */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Cloud size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Cross-device sync</h2>
            {syncStatus === 'syncing' && (
              <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-4)' }}>
                <Loader2 size={10} className="animate-spin" /> Syncing…
              </span>
            )}
            {syncStatus === 'synced' && syncUser && (
              <span className="ml-auto flex items-center gap-1 text-[10px]" style={{ color: '#22c55e' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Synced
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="ml-auto text-[10px]" style={{ color: '#ef4444' }}>Sync error</span>
            )}
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
            Sync jobs, companies, and your profile across desktop and mobile.
          </p>

          {syncUser ? (
            /* Signed in */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{syncUser.email}</span>
              </div>
              <div className="flex items-center gap-3">
                {onSyncNow && (
                  <button
                    onClick={onSyncNow}
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--text-4)' }}
                  >
                    <RefreshCw size={11} /> Sync now
                  </button>
                )}
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--text-4)' }}
                >
                  <LogOut size={11} /> Sign out
                </button>
              </div>
            </div>
          ) : syncSent ? (
            /* Magic link sent */
            <div className="rounded-lg px-4 py-3 text-xs" style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--text-2)' }}>
              Check your inbox — we sent a magic link to <strong>{syncEmail}</strong>
            </div>
          ) : (
            /* Not signed in */
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={syncEmail}
                  onChange={(e) => { setSyncEmail(e.target.value); setSyncEmailError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEnableSync()}
                  className="flex-1 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-1)', outline: 'none' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                />
                <button
                  onClick={handleEnableSync}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', whiteSpace: 'nowrap' }}
                >
                  Enable sync
                </button>
              </div>
              {syncEmailError && (
                <p className="text-xs" style={{ color: '#ef4444' }}>{syncEmailError}</p>
              )}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--surface)', borderColor: '#fde8e8' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#991b1b' }}>Danger zone</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>
            Permanently deletes all data stored in this browser — jobs, companies, profile, API key, and CV. This cannot be undone.
          </p>
          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
          >
            <Trash2 size={13} /> Clear all my data
          </button>
        </div>

      </div>
    </div>
  );
}
