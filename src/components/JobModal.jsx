import { useState, useRef } from 'react';
import { authHeader } from '../lib/authHeader';
import { X, ExternalLink, ChevronDown, Plus, Trash2, MessageSquare, FileText, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { STAGES } from '../data/seed';

const COMPAT_FACTORS = [
  { key: 'roleMatch', label: 'Role fit', hint: 'Does the job match what you want to do?' },
  { key: 'skillsMatch', label: 'Skills match', hint: 'Do you have the required skills?' },
  { key: 'culture', label: 'Culture fit', hint: 'Does the company feel right for you?' },
  { key: 'compensation', label: 'Compensation', hint: 'Does the salary range work for you?' },
  { key: 'growth', label: 'Growth potential', hint: 'Room to grow and advance?' },
];

function StarRow({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star === value ? 0 : star)}
          className="text-lg transition-all"
          style={{ filter: (hover || value) >= star ? 'none' : 'grayscale(1) opacity(0.25)' }}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: 'var(--text-4)' }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border-2)',
  borderRadius: 8,
  color: 'var(--text-1)',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
};

export default function JobModal({ job, defaults = {}, companies, profile, onSave, onClose }) {
  const isEdit = !!job;

  const [form, setForm] = useState({
    title: job?.title || '',
    company: job?.company || defaults.company || '',
    companyId: job?.companyId || defaults.companyId || '',
    location: job?.location || 'Berlin',
    url: job?.url || '',
    stage: job?.stage || defaults.stage || 'saved',
    salary: job?.salary || '',
    remote: job?.remote ?? true,
    tags: job?.tags?.join(', ') || '',
    notes: job?.notes || '',
    activityLog: job?.activityLog || [],
    followUpDate: job?.followUpDate ? job.followUpDate.split('T')[0] : '',
    appliedDate: job?.appliedDate ? job.appliedDate.split('T')[0] : '',
    compatibility: job?.compatibility || { roleMatch: 0, skillsMatch: 0, culture: 0, compensation: 0, growth: 0 },
  });

  // Details accordion: expanded by default for edits, collapsed for new jobs
  const [detailsOpen, setDetailsOpen] = useState(isEdit);

  // Activity log
  const [newEntry, setNewEntry] = useState('');
  const entryRef = useRef(null);

  const addLogEntry = () => {
    const text = newEntry.trim();
    if (!text) return;
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, date: new Date().toISOString(), text };
    setForm((f) => ({ ...f, activityLog: [entry, ...f.activityLog] }));
    setNewEntry('');
    entryRef.current?.focus();
  };

  const deleteLogEntry = (id) => {
    setForm((f) => ({ ...f, activityLog: f.activityLog.filter((e) => e.id !== id) }));
  };

  // Fit analysis
  const [fitAnalysis, setFitAnalysis] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState(null);

  const analyzeFit = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { setFitError('Upload your CV in the Profile tab first.'); return; }
    if (!form.title.trim()) { setFitError('Add a job title first.'); return; }
    setFitLoading(true);
    setFitError(null);
    try {
      const skills = profile?.skills || [];
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          cvText,
          jobTitle: form.title,
          companyName: form.company,
          jobSnippet: form.notes || '',
          skills,
        }),
      });
      const data = await res.json();
      if (data.error) setFitError(data.error);
      else setFitAnalysis(data);
    } catch (err) {
      setFitError(err.message);
    }
    setFitLoading(false);
  };

  // Cover letter
  const [coverLetter, setCoverLetter] = useState(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState(null);
  const [copied, setCopied] = useState(false);

  const draftCoverLetter = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { setCoverLetterError('Upload your CV in the Profile tab first.'); return; }
    if (!form.title.trim()) { setCoverLetterError('Add a job title first.'); return; }
    setCoverLetterLoading(true);
    setCoverLetterError(null);
    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          cvText,
          jobTitle: form.title,
          companyName: form.company,
          jobSnippet: form.notes || '',
          candidateName: profile?.name || '',
          skills: profile?.skills || [],
        }),
      });
      const data = await res.json();
      if (data.error) setCoverLetterError(data.error);
      else setCoverLetter(data.letter);
    } catch (err) {
      setCoverLetterError(err.message);
    }
    setCoverLetterLoading(false);
  };

  const copyLetter = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setCompat = (key, val) => setForm((f) => ({ ...f, compatibility: { ...f.compatibility, [key]: val } }));

  const compatScore = (() => {
    const vals = Object.values(form.compatibility).filter(Boolean);
    if (!vals.length) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100);
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
      appliedDate: form.appliedDate ? new Date(form.appliedDate).toISOString() : null,
      activityLog: form.activityLog,
    });
  };

  const scoreColor = compatScore >= 80 ? '#22c55e' : compatScore >= 60 ? '#f59e0b' : compatScore >= 40 ? '#6366f1' : '#ef4444';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--backdrop)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border flex flex-col fade-in"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', maxHeight: '90vh', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--surface-5)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
              {isEdit ? 'Edit job' : 'Add job'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
              {isEdit ? `Editing ${job.title}` : 'Track a new opportunity'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--text-4)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-5)'; e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-4)'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="job-form" onSubmit={handleSubmit}>

            {/* Required section — always visible */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <Field label="Job title *">
                  <input
                    required
                    placeholder="Senior Product Manager"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  />
                </Field>
              </div>

              <Field label="Company">
                <input
                  list="company-list"
                  placeholder="Type or select..."
                  value={form.company}
                  onChange={(e) => {
                    const val = e.target.value;
                    set('company', val);
                    const found = companies.find((c) => c.name === val);
                    if (found) set('companyId', found.id);
                  }}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                />
                <datalist id="company-list">
                  {companies.map((c) => <option key={c.id} value={c.name} />)}
                </datalist>
              </Field>

              <Field label="Stage">
                <div className="relative">
                  <select
                    value={form.stage}
                    onChange={(e) => set('stage', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                  >
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-4)' }} />
                </div>
              </Field>
            </div>

            {/* Details accordion */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-2)' }}>
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                style={{ background: detailsOpen ? 'var(--surface-2)' : 'var(--surface-2)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Details</span>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--text-4)',
                    transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {detailsOpen && (
                <div className="px-4 pb-4 pt-3 grid grid-cols-2 gap-4" style={{ borderTop: '1px solid var(--surface-5)' }}>
                  <div className="col-span-2">
                    <Field label="Job posting URL">
                      <div className="relative">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={form.url}
                          onChange={(e) => set('url', e.target.value)}
                          style={{ ...inputStyle, paddingRight: form.url ? 36 : 12 }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                        />
                        {form.url && (
                          <a href={form.url} target="_blank" rel="noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6366f1' }}>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </Field>
                  </div>

                  <Field label="Salary range">
                    <input
                      placeholder="80–100k EUR"
                      value={form.salary}
                      onChange={(e) => set('salary', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label="Location">
                    <input
                      placeholder="Berlin (Hybrid)"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label="Remote">
                    <div className="flex items-center gap-2 h-9">
                      <button
                        type="button"
                        onClick={() => set('remote', !form.remote)}
                        className="relative w-10 h-5 rounded-full transition-all"
                        style={{ background: form.remote ? '#6366f1' : 'var(--border-2)' }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                          style={{ transform: form.remote ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                      <span className="text-sm" style={{ color: form.remote ? '#6366f1' : 'var(--text-4)' }}>
                        {form.remote ? 'Remote / Hybrid' : 'On-site only'}
                      </span>
                    </div>
                  </Field>

                  <Field label="Applied date">
                    <input
                      type="date"
                      value={form.appliedDate}
                      onChange={(e) => set('appliedDate', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label="Follow-up date">
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={(e) => set('followUpDate', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label="Tags" hint="comma-separated">
                    <input
                      placeholder="ai, b2b, remote"
                      value={form.tags}
                      onChange={(e) => set('tags', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <div className="col-span-2">
                    <Field label="Notes">
                      <textarea
                        placeholder="Research notes, interview prep, anything relevant..."
                        value={form.notes}
                        onChange={(e) => set('notes', e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                      />
                    </Field>
                  </div>

                  {/* Compatibility */}
                  <div className="col-span-2 rounded-xl p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Compatibility rating</h3>
                      {compatScore > 0 && (
                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{compatScore}% match</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {COMPAT_FACTORS.map(({ key, label, hint }) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className="w-32 shrink-0">
                            <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-4)' }}>{hint}</div>
                          </div>
                          <StarRow value={form.compatibility[key]} onChange={(v) => setCompat(key, v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          {/* Activity Log */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <MessageSquare size={13} style={{ color: '#6366f1' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Activity log</span>
              {form.activityLog.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                  {form.activityLog.length}
                </span>
              )}
            </div>

            {/* New entry input */}
            <div className="flex gap-2 mb-3">
              <input
                ref={entryRef}
                placeholder="Log a call, update, or note..."
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addLogEntry(); } }}
                style={{ ...inputStyle, flex: 1 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              />
              <button
                type="button"
                onClick={addLogEntry}
                disabled={!newEntry.trim()}
                className="px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                style={{
                  background: newEntry.trim() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'var(--surface-5)',
                  color: newEntry.trim() ? '#fff' : 'var(--text-5)',
                  border: 'none',
                }}
              >
                <Plus size={12} /> Log
              </button>
            </div>

            {/* Entries */}
            {form.activityLog.length > 0 ? (
              <div className="space-y-2">
                {form.activityLog.map((entry) => {
                  const d = new Date(entry.date);
                  const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  const timeLabel = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={entry.id}
                      className="group flex gap-2.5 p-2.5 rounded-lg"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#6366f1' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-1)' }}>{entry.text}</p>
                        <span className="text-[10px]" style={{ color: 'var(--text-5)' }}>{dateLabel} at {timeLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteLogEntry(entry.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--text-5)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-5)')}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>No activity yet. Log your first update above.</p>
            )}
          </div>

          {/* Fit analysis */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: '#6366f1' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>CV fit analysis</span>
                {fitAnalysis?.score != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
                    background: fitAnalysis.score >= 80 ? 'rgba(34,197,94,0.12)' : fitAnalysis.score >= 60 ? 'rgba(99,102,241,0.1)' : fitAnalysis.score >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: fitAnalysis.score >= 80 ? '#16a34a' : fitAnalysis.score >= 60 ? '#6366f1' : fitAnalysis.score >= 40 ? '#b45309' : '#dc2626',
                  }}>
                    {fitAnalysis.score}%
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={analyzeFit}
                disabled={fitLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {fitLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {fitLoading ? 'Analyzing…' : fitAnalysis ? 'Re-analyze' : 'Analyze fit'}
              </button>
            </div>

            {fitError && <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{fitError}</p>}

            {fitAnalysis && !fitLoading && (
              <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                {fitAnalysis.verdict && (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{
                    background: fitAnalysis.verdict === 'strong match' ? 'rgba(34,197,94,0.1)' : fitAnalysis.verdict === 'good match' ? 'rgba(99,102,241,0.1)' : fitAnalysis.verdict === 'possible match' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
                    color: fitAnalysis.verdict === 'strong match' ? '#16a34a' : fitAnalysis.verdict === 'good match' ? '#6366f1' : fitAnalysis.verdict === 'possible match' ? '#b45309' : '#dc2626',
                  }}>
                    {fitAnalysis.verdict}
                  </span>
                )}
                {fitAnalysis.summary && (
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{fitAnalysis.summary}</p>
                )}
                {(fitAnalysis.strengths?.length > 0 || fitAnalysis.gaps?.length > 0) && (
                  <div className="space-y-1">
                    {fitAnalysis.strengths?.map((s, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: '#16a34a' }}>✓</span><span style={{ color: 'var(--text-2)' }}>{s}</span></div>
                    ))}
                    {fitAnalysis.gaps?.map((g, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: '#ef4444' }}>✗</span><span style={{ color: 'var(--text-3)' }}>{g}</span></div>
                    ))}
                  </div>
                )}
                {fitAnalysis.highlights?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-4)' }}>LEAD WITH</p>
                    {fitAnalysis.highlights.map((h, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: '#6366f1' }}>→</span><span style={{ color: 'var(--text-2)' }}>{h}</span></div>
                    ))}
                  </div>
                )}
                {fitAnalysis.watchouts?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-4)' }}>WATCH OUT</p>
                    {fitAnalysis.watchouts.map((w, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: '#f59e0b' }}>⚠</span><span style={{ color: 'var(--text-3)' }}>{w}</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!fitAnalysis && !fitLoading && !fitError && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>
                Analyze how well your CV matches this role.
              </p>
            )}
          </div>

          {/* Cover letter */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <FileText size={13} style={{ color: '#7c3aed' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Cover letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {coverLetter && (
                  <button
                    type="button"
                    onClick={copyLetter}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: copied ? 'rgba(34,197,94,0.1)' : 'var(--surface-5)',
                      color: copied ? '#16a34a' : 'var(--text-4)',
                      border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'var(--border-2)'}`,
                    }}
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={draftCoverLetter}
                  disabled={coverLetterLoading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    background: coverLetter ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.08)',
                    color: '#7c3aed',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}
                >
                  {coverLetterLoading ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
                  {coverLetterLoading ? 'Drafting…' : coverLetter ? 'Re-draft' : 'Draft letter'}
                </button>
              </div>
            </div>

            {coverLetterError && (
              <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{coverLetterError}</p>
            )}

            {coverLetter && (
              <div
                className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl p-4 max-h-64 overflow-y-auto"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}
              >
                {coverLetter}
              </div>
            )}

            {!coverLetter && !coverLetterLoading && !coverLetterError && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>
                Draft a tailored cover letter based on your CV and this role.
              </p>
            )}
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--surface-5)' }}>
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            Cancel
          </button>
          <button
            type="submit" form="job-form"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isEdit ? 'Save changes' : 'Add to pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}
