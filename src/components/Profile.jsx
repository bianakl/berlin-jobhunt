import { useState, useRef } from 'react';
import { User, Plus, X, Save, Upload, Key, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { INDUSTRIES } from '../data/seed';

const inputStyle = {
  width: '100%',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  color: '#111827',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
};

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: '#9ca3af' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function Profile({ profile, onUpdate }) {
  const [form, setForm] = useState({ ...profile });
  const [skillInput, setSkillInput] = useState('');
  const [saved, setSaved] = useState(false);

  // AI / CV state
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('scout-claude-key') || '');
  const [cvFileName, setCvFileName] = useState(() => localStorage.getItem('scout-cv-name') || '');
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

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

    if (!apiKey) {
      // Just store the file text for later
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        localStorage.setItem('scout-cv-text', text);
        setExtractMsg('CV text saved. Add your API key and click Extract to populate your profile.');
      } else {
        // Store as base64 for later
        const reader = new FileReader();
        reader.onload = (e) => {
          const b64 = e.target.result.split(',')[1];
          localStorage.setItem('scout-cv-b64', b64);
          setExtractMsg('CV saved. Add your API key and click Extract to populate your profile.');
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    await extractFromFile(file);
  };

  const extractFromFile = async (file) => {
    if (!apiKey) {
      setExtractMsg('Add your Anthropic API key first.');
      return;
    }
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setExtractMsg(`Error: ${data.error}`);
      } else {
        // Merge extracted data into form (keep existing non-empty values)
        setForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          currentRole: data.currentRole || prev.currentRole,
          skills: data.skills?.length ? data.skills : prev.skills,
          yearsExperience: data.yearsExperience || prev.yearsExperience,
          preferredIndustries: data.preferredIndustries?.length ? data.preferredIndustries : prev.preferredIndustries,
          salaryMin: data.salaryMin || prev.salaryMin,
          salaryMax: data.salaryMax || prev.salaryMax,
          bio: data.bio || prev.bio,
        }));
        // Store CV as text representation for job analysis
        if (body.cvText) localStorage.setItem('scout-cv-text', body.cvText);
        else localStorage.setItem('scout-cv-text', JSON.stringify(data)); // fallback: use extracted JSON as context
        setExtractMsg('Profile extracted! Review the fields below and save.');
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
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setExtractMsg(`Error: ${data.error}`);
      } else {
        setForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          currentRole: data.currentRole || prev.currentRole,
          skills: data.skills?.length ? data.skills : prev.skills,
          yearsExperience: data.yearsExperience || prev.yearsExperience,
          preferredIndustries: data.preferredIndustries?.length ? data.preferredIndustries : prev.preferredIndustries,
          salaryMin: data.salaryMin || prev.salaryMin,
          salaryMax: data.salaryMax || prev.salaryMax,
          bio: data.bio || prev.bio,
        }));
        if (!text) localStorage.setItem('scout-cv-text', JSON.stringify(data));
        setExtractMsg('Profile extracted! Review the fields below and save.');
      }
    } catch (err) {
      setExtractMsg(`Error: ${err.message}`);
    }
    setExtracting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>Profile</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
            Your profile powers compatibility scoring on job cards
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
          style={{ background: saved ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Save size={13} />
          {saved ? 'Saved!' : 'Save profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* AI + CV Upload card */}
        <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>AI profile extraction</h2>
          </div>

          {/* API Key */}
          <div className="mb-4">
            <Field label="Anthropic API key" hint="— stored locally, never sent anywhere else">
              <div className="relative">
                <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    localStorage.setItem('scout-claude-key', apiKey);
                  }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>
                Get a key at console.anthropic.com. Used for CV extraction and job compatibility analysis.
              </p>
            </Field>
          </div>

          {/* CV Upload */}
          <div
            className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all"
            style={{ borderColor: dragging ? '#6366f1' : '#e8e8f4', background: dragging ? 'rgba(99,102,241,0.04)' : '#fafafa' }}
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
            <Upload size={20} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
            {cvFileName ? (
              <div>
                <p className="text-xs font-medium" style={{ color: '#6366f1' }}>{cvFileName}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>Click to replace</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium" style={{ color: '#6b7280' }}>Drop your CV here or click to upload</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>PDF or TXT · max 5 MB</p>
              </div>
            )}
          </div>

          {/* Extract button + message */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleExtractClick}
              disabled={extracting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: extracting ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', cursor: extracting ? 'not-allowed' : 'pointer' }}
            >
              {extracting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {extracting ? 'Extracting...' : 'Extract profile from CV'}
            </button>
            {extractMsg && (
              <p className="text-xs flex-1" style={{ color: extractMsg.startsWith('Error') ? '#ef4444' : extractMsg.includes('extracted') ? '#22c55e' : '#6b7280' }}>
                {extractMsg.includes('extracted') && <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />}
                {extractMsg}
              </p>
            )}
          </div>
        </div>

        {/* Basic info card */}
        <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>Basic info</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Your name">
              <input
                placeholder="Biana K."
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </Field>
            <Field label="Current role">
              <input
                placeholder="Senior Product Manager"
                value={form.currentRole}
                onChange={(e) => set('currentRole', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </Field>
            <Field label="Preferred locations" hint="— comma-separated">
              <input
                placeholder="Berlin, Remote"
                value={form.preferredLocations}
                onChange={(e) => set('preferredLocations', e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Skills card */}
        <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Skills</h2>
          <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
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
              <span className="text-xs" style={{ color: '#d1d5db' }}>No skills added yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Add a skill (e.g. B2B, AI, fintech)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="flex-1 text-xs px-3 py-2 rounded-lg"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', outline: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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

        {/* Salary + Industries */}
        <div className="grid grid-cols-2 gap-5">
          {/* Salary */}
          <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Salary expectations</h2>
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
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>
            </div>
          </div>

          {/* Preferred industries */}
          <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: '#111827' }}>Preferred industries</h2>
            <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>Select all that interest you</p>
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
                      background: active ? 'rgba(99,102,241,0.1)' : '#f3f4f6',
                      color: active ? '#6366f1' : '#6b7280',
                      border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
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
      </div>
    </div>
  );
}
