import { useState } from 'react';
import { X, Star, ChevronDown, Linkedin, Mail } from 'lucide-react';
import { INDUSTRIES, COMPANY_SIZES } from '../data/seed';

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

export default function CompanyModal({ company, onSave, onClose }) {
  const isEdit = !!company;

  const [form, setForm] = useState({
    name: company?.name || '',
    website: company?.website || '',
    industry: company?.industry || '',
    size: company?.size || '',
    notes: company?.notes || '',
    favorite: company?.favorite ?? false,
    atsType: company?.atsType || '',
    atsSlug: company?.atsSlug || '',
    linkedinUrl: company?.linkedinUrl || '',
    connections: company?.connections || '',
    referral: company?.referral ?? false,
    viaForm: company?.viaForm ?? false,
    email: company?.email || '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const atsHint = form.atsType === 'lever'
    ? 'e.g. "company" from jobs.lever.co/company'
    : form.atsType === 'greenhouse'
    ? 'e.g. "n26" from boards.greenhouse.io/n26'
    : form.atsType === 'ashby'
    ? 'e.g. "DeepL" from jobs.ashbyhq.com/DeepL'
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,24,39,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border flex flex-col fade-in"
        style={{ background: '#fff', borderColor: '#e8e8f4', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f3f4f6' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#111827' }}>
              {isEdit ? 'Edit company' : 'Add company'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {isEdit ? `Editing ${company.name}` : 'Add a company to your research list'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <form id="company-form" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Field label="Company name *">
                <input
                  required
                  placeholder="N26, Zalando, ..."
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

              <Field label="Careers page URL">
                <input
                  type="url"
                  placeholder="https://company.com/careers"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Industry">
                  <div className="relative">
                    <select
                      value={form.industry}
                      onChange={(e) => set('industry', e.target.value)}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      <option value="">Select...</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                  </div>
                </Field>

                <Field label="Company size">
                  <div className="relative">
                    <select
                      value={form.size}
                      onChange={(e) => set('size', e.target.value)}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: 28, cursor: 'pointer' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      <option value="">Select...</option>
                      {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                  </div>
                </Field>
              </div>

              {/* ATS Integration */}
              <div className="rounded-xl p-3.5 border" style={{ background: '#f9fafb', borderColor: '#e5e7eb' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#374151' }}>Job board integration</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ATS type">
                    <div className="relative">
                      <select
                        value={form.atsType}
                        onChange={(e) => set('atsType', e.target.value)}
                        style={{ ...inputStyle, appearance: 'none', paddingRight: 28, cursor: 'pointer', background: '#fff' }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      >
                        <option value="">None</option>
                        <option value="lever">Lever</option>
                        <option value="greenhouse">Greenhouse</option>
                        <option value="ashby">Ashby</option>
                      </select>
                      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                    </div>
                  </Field>

                  <Field label="Slug" hint={atsHint ? `— ${atsHint}` : ''}>
                    <input
                      placeholder={form.atsType ? 'company-slug' : '—'}
                      value={form.atsSlug}
                      onChange={(e) => set('atsSlug', e.target.value)}
                      disabled={!form.atsType}
                      style={{ ...inputStyle, background: '#fff', opacity: form.atsType ? 1 : 0.5 }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                  </Field>
                </div>
              </div>

              <Field label="Research notes">
                <textarea
                  placeholder="Culture, tech stack, why you're interested, people to connect with..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </Field>

              {/* Outreach tracking */}
              <div className="rounded-xl p-3.5 border" style={{ background: '#f9fafb', borderColor: '#e5e7eb' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#374151' }}>Outreach tracking</p>
                <div className="space-y-3">
                  <Field label="Company LinkedIn URL">
                    <input
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={form.linkedinUrl}
                      onChange={(e) => set('linkedinUrl', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Connections" hint="— 1st, 2nd, name...">
                      <input
                        placeholder="e.g. 2nd degree"
                        value={form.connections}
                        onChange={(e) => set('connections', e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      />
                    </Field>
                    <Field label="Contact email">
                      <input
                        type="email"
                        placeholder="hiring@company.com"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => set('referral', !form.referral)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all"
                      style={{
                        background: form.referral ? 'rgba(34,197,94,0.06)' : '#fff',
                        borderColor: form.referral ? 'rgba(34,197,94,0.3)' : '#e5e7eb',
                        color: form.referral ? '#22c55e' : '#6b7280',
                      }}
                    >
                      <span>{form.referral ? '✅' : '⬜'}</span> Referral
                    </button>
                    <button
                      type="button"
                      onClick={() => set('viaForm', !form.viaForm)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all"
                      style={{
                        background: form.viaForm ? 'rgba(99,102,241,0.06)' : '#fff',
                        borderColor: form.viaForm ? 'rgba(99,102,241,0.3)' : '#e5e7eb',
                        color: form.viaForm ? '#6366f1' : '#6b7280',
                      }}
                    >
                      <span>{form.viaForm ? '✅' : '⬜'}</span> Applied via form
                    </button>
                  </div>
                </div>
              </div>

              {/* Favorite toggle */}
              <button
                type="button"
                onClick={() => set('favorite', !form.favorite)}
                className="flex items-center gap-2.5 w-full p-3 rounded-xl border transition-all text-left"
                style={{
                  background: form.favorite ? 'rgba(245,158,11,0.04)' : '#f9fafb',
                  borderColor: form.favorite ? 'rgba(245,158,11,0.25)' : '#e5e7eb',
                }}
              >
                <Star size={15} fill={form.favorite ? '#f59e0b' : 'none'} style={{ color: form.favorite ? '#f59e0b' : '#9ca3af' }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: form.favorite ? '#f59e0b' : '#374151' }}>
                    {form.favorite ? 'Favorited' : 'Mark as favorite'}
                  </div>
                  <div className="text-xs" style={{ color: '#9ca3af' }}>Favorites are highlighted across the app</div>
                </div>
              </button>
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
            type="submit" form="company-form"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isEdit ? 'Save changes' : 'Add company'}
          </button>
        </div>
      </div>
    </div>
  );
}
