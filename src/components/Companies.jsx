import { useState } from 'react';
import { Star, ExternalLink, Pencil, Trash2, Plus, Building2, Briefcase, Search } from 'lucide-react';
import { STAGES } from '../data/seed';

export default function Companies({ companies, jobs, onAddCompany, onEditCompany, onDeleteCompany, onAddJob }) {
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);

  const filtered = companies.filter((c) => {
    if (favOnly && !c.favorite) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.industry?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const jobsForCompany = (companyId) => jobs.filter((j) => j.companyId === companyId);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>Companies</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
            {companies.length} companies tracked · {filtered.length} shown
          </p>
        </div>
        <button
          onClick={onAddCompany}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <Plus size={14} />Add company
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search companies or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={{ background: '#fff', border: '1px solid #e8e8f4', color: '#111827' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e8e8f4')}
          />
        </div>
        <button
          onClick={() => setFavOnly((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: favOnly ? 'rgba(245,158,11,0.08)' : '#fff',
            color: favOnly ? '#f59e0b' : '#6b7280',
            border: `1px solid ${favOnly ? 'rgba(245,158,11,0.25)' : '#e8e8f4'}`,
          }}
        >
          <Star size={13} fill={favOnly ? '#f59e0b' : 'none'} />
          Favorites
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 size={32} style={{ color: '#e8e8f4', margin: '0 auto 12px' }} />
          <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
            {companies.length === 0 ? 'No companies yet.' : 'Nothing matches your filter.'}
          </p>
          {companies.length === 0 && (
            <button
              onClick={onAddCompany}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              Add your first company
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              companyJobs={jobsForCompany(company.id)}
              onEdit={onEditCompany}
              onDelete={onDeleteCompany}
              onAddJob={onAddJob}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company, companyJobs, onEdit, onDelete, onAddJob }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const activeJobs = companyJobs.filter((j) => j.stage !== 'rejected');
  const highestStage = (() => {
    const priority = ['offer', 'interview', 'applied', 'researching', 'saved'];
    for (const s of priority) {
      if (activeJobs.some((j) => j.stage === s)) return STAGES.find((st) => st.id === s);
    }
    return null;
  })();

  return (
    <div
      className="rounded-xl border p-4 group relative flex flex-col gap-3 transition-all"
      style={{ background: '#fff', borderColor: '#e8e8f4' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.07)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Top */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          {company.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{company.name}</span>
            {company.favorite && <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b', flexShrink: 0 }} />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {company.industry && <span className="text-xs" style={{ color: '#9ca3af' }}>{company.industry}</span>}
            {company.size && <><span style={{ color: '#d1d5db' }}>·</span><span className="text-xs" style={{ color: '#9ca3af' }}>{company.size}</span></>}
          </div>
        </div>

        {/* Menu */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-base leading-none"
            style={{ background: menuOpen ? '#f3f4f6' : 'transparent', color: '#9ca3af' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={(e) => !menuOpen && (e.currentTarget.style.background = 'transparent')}
          >
            ···
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 rounded-xl border py-1 min-w-[155px] fade-in"
              style={{ background: '#fff', borderColor: '#e8e8f4', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
            >
              {company.website && (
                <a
                  href={company.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink size={11} /> Open careers page
                </a>
              )}
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                style={{ color: '#6b7280' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                onClick={() => { onAddJob({ companyId: company.id, company: company.name }); setMenuOpen(false); }}
              >
                <Briefcase size={11} /> Add job here
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                style={{ color: '#6b7280' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                onClick={() => { onEdit(company); setMenuOpen(false); }}
              >
                <Pencil size={11} /> Edit
              </button>
              <div style={{ borderTop: '1px solid #e8e8f4', margin: '4px 0' }} />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => { onDelete(company.id); setMenuOpen(false); }}
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {company.notes && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6b7280' }}>{company.notes}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid #f3f4f6' }}>
        <div className="flex items-center gap-2">
          {activeJobs.length > 0 ? (
            <>
              <span className="text-xs" style={{ color: '#9ca3af' }}>
                {activeJobs.length} {activeJobs.length === 1 ? 'job' : 'jobs'} tracked
              </span>
              {highestStage && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: highestStage.bg, color: highestStage.color, border: `1px solid ${highestStage.border}` }}
                >
                  {highestStage.emoji} {highestStage.label}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs" style={{ color: '#d1d5db' }}>No jobs tracked</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {company.website && (
            <a
              href={company.website} target="_blank" rel="noreferrer"
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ color: '#d1d5db' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
              title="Open careers page"
            >
              <ExternalLink size={12} />
            </a>
          )}
          <button
            onClick={() => onAddJob({ companyId: company.id, company: company.name })}
            className="w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: '#d1d5db' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
            title="Add job"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
