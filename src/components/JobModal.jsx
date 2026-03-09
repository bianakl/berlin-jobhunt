import { useState } from 'react';
import { X, ExternalLink, ChevronDown } from 'lucide-react';
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
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: '#9ca3af' }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  color: '#111827',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
};

export default function JobModal({ job, defaults = {}, companies, onSave, onClose }) {
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
    followUpDate: job?.followUpDate ? job.followUpDate.split('T')[0] : '',
    appliedDate: job?.appliedDate ? job.appliedDate.split('T')[0] : '',
    compatibility: job?.compatibility || { roleMatch: 0, skillsMatch: 0, culture: 0, compensation: 0, growth: 0 },
  });

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
    });
  };

  const scoreColor = compatScore >= 80 ? '#22c55e' : compatScore >= 60 ? '#f59e0b' : compatScore >= 40 ? '#6366f1' : '#ef4444';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border flex flex-col fade-in"
        style={{ background: '#fff', borderColor: '#e8e8f4', maxHeight: '90vh', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f3f4f6' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#111827' }}>
              {isEdit ? 'Edit job' : 'Add job'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {isEdit ? `Editing ${job.title}` : 'Track a new opportunity in your pipeline'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ color: '#9ca3af', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="job-form" onSubmit={handleSubmit}>
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
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    {STAGES.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                </div>
              </Field>

              <Field label="Location">
                <input
                  placeholder="Berlin (Hybrid)"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

              <Field label="Salary range">
                <input
                  placeholder="80–100k EUR"
                  value={form.salary}
                  onChange={(e) => set('salary', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

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
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                    {form.url && (
                      <a href={form.url} target="_blank" rel="noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6366f1' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </Field>
              </div>

              <Field label="Tags" hint="comma-separated">
                <input
                  placeholder="ai, b2b, remote"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

              <Field label="Remote">
                <div className="flex items-center gap-2 h-9">
                  <button
                    type="button"
                    onClick={() => set('remote', !form.remote)}
                    className="relative w-10 h-5 rounded-full transition-all"
                    style={{ background: form.remote ? '#6366f1' : '#e5e7eb' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
                      style={{ transform: form.remote ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                  <span className="text-sm" style={{ color: form.remote ? '#6366f1' : '#9ca3af' }}>
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
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

              <Field label="Follow-up date">
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => set('followUpDate', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </Field>
              </div>
            </div>

            {/* Compatibility */}
            <div className="rounded-xl p-4 border" style={{ background: '#f9fafb', borderColor: '#e5e7eb' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold" style={{ color: '#374151' }}>Compatibility rating</h3>
                {compatScore > 0 && (
                  <span className="text-sm font-bold" style={{ color: scoreColor }}>{compatScore}% match</span>
                )}
              </div>
              <div className="space-y-3">
                {COMPAT_FACTORS.map(({ key, label, hint }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <div className="text-xs font-medium" style={{ color: '#374151' }}>{label}</div>
                      <div className="text-[10px]" style={{ color: '#9ca3af' }}>{hint}</div>
                    </div>
                    <StarRow value={form.compatibility[key]} onChange={(v) => setCompat(key, v)} />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: '#f3f4f6' }}>
          <button
            type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            Cancel
          </button>
          <button
            type="submit" form="job-form"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
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
