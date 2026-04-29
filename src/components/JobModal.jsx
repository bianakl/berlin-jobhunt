import { useState, useRef } from 'react';
import { authHeader } from '../lib/authHeader';
import { X, ExternalLink, ChevronDown, Plus, Trash2, MessageSquare, FileText, Copy, Check, Loader2, Sparkles, BookOpen, Linkedin } from 'lucide-react';
import { STAGES } from '../data/seed';
import { useT } from '../lib/LanguageContext';

const COMPAT_FACTOR_KEYS = [
  { key: 'roleMatch', labelKey: 'job_role_fit', hintKey: 'job_role_fit_hint' },
  { key: 'skillsMatch', labelKey: 'job_skills_match', hintKey: 'job_skills_match_hint' },
  { key: 'culture', labelKey: 'job_culture_fit', hintKey: 'job_culture_fit_hint' },
  { key: 'compensation', labelKey: 'job_compensation', hintKey: 'job_compensation_hint' },
  { key: 'growth', labelKey: 'job_growth', hintKey: 'job_growth_hint' },
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
        {hint && <span className="ml-1 font-normal" style={{ color: 'var(--text-4)' }}>{hint}</span>}
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

export default function JobModal({ job, defaults = {}, companies, profile, onNeedCv, onAnalyzed, onSave, onClose }) {
  const t = useT();
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

  // Fit analysis — init from saved job data so results persist across sessions
  const [fitAnalysis, setFitAnalysis] = useState(job?.fitAnalysis || null);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState(null);

  const analyzeFit = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { onNeedCv?.(() => analyzeFit()); return; }
    if (!form.title.trim()) { setFitError(t('job_no_title_err')); return; }
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
      else { setFitAnalysis(data); onAnalyzed?.(data); }
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

  // Interview prep
  const [interviewPrep, setInterviewPrep] = useState(job?.interviewPrep || null);
  const [interviewPrepLoading, setInterviewPrepLoading] = useState(false);
  const [interviewPrepError, setInterviewPrepError] = useState(null);

  // LinkedIn outreach
  const [outreachMsg, setOutreachMsg] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState(null);
  const [outreachCopied, setOutreachCopied] = useState(false);

  const draftCoverLetter = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { onNeedCv?.(() => draftCoverLetter()); return; }
    if (!form.title.trim()) { setCoverLetterError(t('job_no_title_err')); return; }
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

  const draftOutreach = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { onNeedCv?.(() => draftOutreach()); return; }
    if (!form.title.trim()) { setOutreachError(t('job_no_title_err')); return; }
    setOutreachLoading(true);
    setOutreachError(null);
    try {
      const res = await fetch('/api/linkedin-outreach', {
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
      if (data.error) setOutreachError(data.error);
      else setOutreachMsg(data.message);
    } catch (err) {
      setOutreachError(err.message);
    }
    setOutreachLoading(false);
  };

  const copyOutreach = () => {
    if (!outreachMsg) return;
    navigator.clipboard.writeText(outreachMsg).then(() => {
      setOutreachCopied(true);
      setTimeout(() => setOutreachCopied(false), 2000);
    });
  };

  const prepInterview = async () => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { onNeedCv?.(() => prepInterview()); return; }
    if (!form.title.trim()) { setInterviewPrepError(t('job_no_title_err')); return; }
    setInterviewPrepLoading(true);
    setInterviewPrepError(null);
    try {
      const res = await fetch('/api/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          cvText,
          jobTitle: form.title,
          companyName: form.company,
          jobSnippet: form.notes || '',
          skills: profile?.skills || [],
        }),
      });
      const data = await res.json();
      if (data.error) setInterviewPrepError(data.error);
      else setInterviewPrep(data);
    } catch (err) {
      setInterviewPrepError(err.message);
    }
    setInterviewPrepLoading(false);
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
      fitAnalysis: fitAnalysis || undefined,
      interviewPrep: interviewPrep || undefined,
    });
  };

  const scoreColor = compatScore >= 80 ? '#22c55e' : compatScore >= 60 ? '#f59e0b' : compatScore >= 40 ? '#6366f1' : '#ef4444';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'var(--backdrop)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border flex flex-col fade-in"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', maxHeight: '92dvh', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ borderColor: 'var(--surface-5)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
              {isEdit ? t('job_modal_edit') : t('job_modal_add')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
              {isEdit ? t('job_modal_edit_sub', { title: job.title }) : t('job_modal_add_sub')}
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
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-5">
          <form id="job-form" onSubmit={handleSubmit}>

            {/* Required section — always visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div className="col-span-2">
                <Field label={t('job_title_label')}>
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

              <Field label={t('job_company_label')}>
                <input
                  list="company-list"
                  placeholder={t('job_company_placeholder')}
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

              <Field label={t('job_stage_label')}>
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
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_details')}</span>
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
                <div className="px-3 sm:px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" style={{ borderTop: '1px solid var(--surface-5)' }}>
                  <div className="col-span-2">
                    <Field label={t('job_url_label')}>
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

                  <Field label={t('job_salary_label')}>
                    <input
                      placeholder={t('job_salary_placeholder')}
                      value={form.salary}
                      onChange={(e) => set('salary', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label={t('job_location_label')}>
                    <input
                      placeholder={t('job_location_placeholder')}
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
                        {form.remote ? t('job_remote_label') : t('job_onsite_label')}
                      </span>
                    </div>
                  </Field>

                  <Field label={t('job_applied_date')}>
                    <input
                      type="date"
                      value={form.appliedDate}
                      onChange={(e) => set('appliedDate', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label={t('job_followup_date')}>
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={(e) => set('followUpDate', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <Field label={t('job_tags_label')} hint={t('job_tags_hint')}>
                    <input
                      placeholder={t('job_tags_placeholder')}
                      value={form.tags}
                      onChange={(e) => set('tags', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                    />
                  </Field>

                  <div className="col-span-2">
                    <Field label={t('job_notes_label')}>
                      <textarea
                        placeholder={t('job_notes_placeholder')}
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
                      <h3 className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_compat')}</h3>
                      {compatScore > 0 && (
                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{t('job_compat_match', { score: compatScore })}</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {COMPAT_FACTOR_KEYS.map(({ key, labelKey, hintKey }) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className="w-32 shrink-0">
                            <div className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{t(labelKey)}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-4)' }}>{t(hintKey)}</div>
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
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_activity')}</span>
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
                placeholder={t('job_activity_placeholder')}
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
                <Plus size={12} /> {t('job_activity_btn')}
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
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>{t('job_activity_empty')}</p>
            )}
          </div>

          {/* Fit analysis */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: '#6366f1' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_cv_fit')}</span>
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
                {fitLoading ? t('job_analyzing') : fitAnalysis ? t('job_reanalyze') : t('job_analyze_fit')}
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
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-4)' }}>{t('job_lead_with')}</p>
                    {fitAnalysis.highlights.map((h, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: '#6366f1' }}>→</span><span style={{ color: 'var(--text-2)' }}>{h}</span></div>
                    ))}
                  </div>
                )}
                {fitAnalysis.watchouts?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-4)' }}>{t('job_watch_out')}</p>
                    {fitAnalysis.watchouts.map((w, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px]"><span style={{ color: '#f59e0b' }}>⚠</span><span style={{ color: 'var(--text-3)' }}>{w}</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!fitAnalysis && !fitLoading && !fitError && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>
                {t('job_analyze_hint')}
              </p>
            )}
          </div>

          {/* Cover letter */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <FileText size={13} style={{ color: '#7c3aed' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_cover_letter')}</span>
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
                    {copied ? t('job_copied') : t('job_copy')}
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
                  {coverLetterLoading ? t('job_drafting') : coverLetter ? t('job_redraft') : t('job_draft_letter')}
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
                {t('job_draft_hint')}
              </p>
            )}
          </div>

          {/* LinkedIn outreach */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Linkedin size={13} style={{ color: '#0a66c2' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_linkedin_outreach')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {outreachMsg && (
                  <button
                    type="button"
                    onClick={copyOutreach}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: outreachCopied ? 'rgba(34,197,94,0.1)' : 'var(--surface-5)',
                      color: outreachCopied ? '#16a34a' : 'var(--text-4)',
                      border: `1px solid ${outreachCopied ? 'rgba(34,197,94,0.2)' : 'var(--border-2)'}`,
                    }}
                  >
                    {outreachCopied ? <Check size={10} /> : <Copy size={10} />}
                    {outreachCopied ? t('job_outreach_copied') : t('job_outreach_copy')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={draftOutreach}
                  disabled={outreachLoading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: 'rgba(10,102,194,0.08)', color: '#0a66c2', border: '1px solid rgba(10,102,194,0.2)' }}
                >
                  {outreachLoading ? <Loader2 size={10} className="animate-spin" /> : <Linkedin size={10} />}
                  {outreachLoading ? t('job_outreaching') : outreachMsg ? t('job_reoutreach_btn') : t('job_outreach_btn')}
                </button>
              </div>
            </div>

            {outreachError && (
              <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{outreachError}</p>
            )}

            {outreachMsg && (
              <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                <p className="text-[11px] leading-relaxed whitespace-pre-wrap mb-2" style={{ color: 'var(--text-2)' }}>{outreachMsg}</p>
                <p className="text-[10px]" style={{ color: outreachMsg.length > 300 ? '#ef4444' : 'var(--text-5)' }}>
                  {t('job_char_count', { count: outreachMsg.length })}
                </p>
              </div>
            )}

            {!outreachMsg && !outreachLoading && !outreachError && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>
                {t('job_outreach_hint')}
              </p>
            )}
          </div>

          {/* Interview prep */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen size={13} style={{ color: '#0891b2' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{t('job_interview_prep')}</span>
              </div>
              <button
                type="button"
                onClick={prepInterview}
                disabled={interviewPrepLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: 'rgba(8,145,178,0.08)', color: '#0891b2', border: '1px solid rgba(8,145,178,0.2)' }}
              >
                {interviewPrepLoading ? <Loader2 size={10} className="animate-spin" /> : <BookOpen size={10} />}
                {interviewPrepLoading ? t('job_prepping') : interviewPrep ? t('job_reprep_btn') : t('job_prep_btn')}
              </button>
            </div>

            {interviewPrepError && (
              <p className="text-xs mb-2" style={{ color: '#ef4444' }}>{interviewPrepError}</p>
            )}

            {interviewPrep && !interviewPrepLoading && (
              <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
                {interviewPrep.talkingPoints?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>{t('job_talking_points')}</p>
                    {interviewPrep.talkingPoints.map((tp, i) => (
                      <div key={i} className="flex gap-1.5 text-[11px] mb-1">
                        <span style={{ color: '#0891b2' }}>→</span>
                        <span style={{ color: 'var(--text-2)' }}>{tp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {['Role fit', 'Behavioral', 'Tough'].map((cat) => {
                  const qs = interviewPrep.questions?.filter((q) => q.category === cat) || [];
                  if (!qs.length) return null;
                  const labelKey = cat === 'Role fit' ? 'job_role_fit_q' : cat === 'Behavioral' ? 'job_behavioral_q' : 'job_tough_q';
                  return (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>{t(labelKey)}</p>
                      <div className="space-y-2">
                        {qs.map((item, i) => (
                          <div key={i} className="rounded-lg p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--surface-5)' }}>
                            <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--text-1)' }}>{item.q}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>{item.hint}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!interviewPrep && !interviewPrepLoading && !interviewPrepError && (
              <p className="text-xs text-center py-3" style={{ color: 'var(--text-5)' }}>
                {t('job_prep_hint')}
              </p>
            )}
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t" style={{ borderColor: 'var(--surface-5)' }}>
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            {t('job_cancel')}
          </button>
          <button
            type="submit" form="job-form"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isEdit ? t('job_save') : t('job_add')}
          </button>
        </div>
      </div>
    </div>
  );
}
