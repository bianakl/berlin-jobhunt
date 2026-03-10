import { useState, useCallback } from 'react';
import {
  Star, ExternalLink, Pencil, Trash2, Plus, Building2, Search, RefreshCw, X,
  CheckSquare, Loader2, Link2, Mail, Users, Kanban, Sparkles, ChevronRight,
} from 'lucide-react';
import { STAGES } from '../data/seed';

const PM_REGEX = /\b(product manager|head of product|vp.{0,5}product|product lead|chief product|director.{0,5}product|group product manager)\b/i;

async function fetchPositionsForCompany(company) {
  const { atsType, atsSlug } = company;
  if (!atsType || !atsSlug) return [];

  try {
    if (atsType === 'lever') {
      const res = await fetch(`https://api.lever.co/v0/postings/${atsSlug}?mode=json`);
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = Array.isArray(data) ? data : [];
      return jobs
        .filter((j) => PM_REGEX.test(j.text || ''))
        .map((j) => {
          const plain = j.descriptionPlain || j.description || '';
          const snippet = plain.replace(/<[^>]+>/g, '').trim().slice(0, 160) || '';
          return {
            id: j.id,
            title: j.text,
            url: j.hostedUrl || `https://jobs.lever.co/${atsSlug}/${j.id}`,
            source: 'lever',
            snippet,
            team: j.categories?.team || j.categories?.department || '',
            location: j.categories?.location || '',
            foundDate: new Date().toISOString(),
          };
        });
    } else if (atsType === 'greenhouse') {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${atsSlug}/jobs`);
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = data.jobs || [];
      return jobs
        .filter((j) => PM_REGEX.test(j.title || ''))
        .map((j) => {
          const dept = j.departments?.[0]?.name || '';
          const loc = j.location?.name || '';
          const snippet = [dept, loc].filter(Boolean).join(' · ');
          return {
            id: String(j.id),
            title: j.title,
            url: j.absolute_url || `https://boards.greenhouse.io/${atsSlug}/jobs/${j.id}`,
            source: 'greenhouse',
            snippet,
            location: loc,
            team: dept,
            foundDate: new Date().toISOString(),
          };
        });
    } else if (atsType === 'ashby') {
      const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${atsSlug}`);
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = data.jobs || data.jobPostings || [];
      return jobs
        .filter((j) => PM_REGEX.test(j.title || ''))
        .map((j) => ({
          id: j.id,
          title: j.title,
          url: j.jobUrl || `https://jobs.ashbyhq.com/${atsSlug}/${j.id}`,
          source: 'ashby',
          snippet: j.descriptionPlain?.slice(0, 160) || '',
          team: j.team || j.department || '',
          location: j.location || '',
          foundDate: new Date().toISOString(),
        }));
    }
  } catch {
    return [];
  }
  return [];
}

export default function Companies({ companies, jobs, onAddCompany, onEditCompany, onDeleteCompany, onAddJob, onUpdateCompany }) {
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [hasPmOnly, setHasPmOnly] = useState(false);
  const [sort, setSort] = useState('default');
  const [checkingAll, setCheckingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = companies
    .filter((c) => {
      if (favOnly && !c.favorite) return false;
      if (hasPmOnly && !(c.positions?.length > 0)) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.industry?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'most') return (b.positions?.length || 0) - (a.positions?.length || 0);
      const aHas = (a.positions?.length || 0) > 0 ? 1 : 0;
      const bHas = (b.positions?.length || 0) > 0 ? 1 : 0;
      if (bHas !== aHas) return bHas - aHas;
      return a.name.localeCompare(b.name);
    });

  const jobsForCompany = (companyId) => jobs.filter((j) => j.companyId === companyId);

  const checkableCompanies = companies.filter((c) => c.atsType && c.atsSlug);

  const handleCheckAll = async () => {
    setCheckingAll(true);
    for (const company of checkableCompanies) {
      const autoFound = await fetchPositionsForCompany(company);
      const manualPositions = (company.positions || []).filter((p) => p.source === 'manual');
      onUpdateCompany(company.id, {
        positions: [...manualPositions, ...autoFound],
        atsCheckedAt: new Date().toISOString(),
      });
    }
    setCheckingAll(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>Companies</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
            {companies.length} companies tracked · {filtered.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checkableCompanies.length > 0 && (
            <button
              onClick={handleCheckAll}
              disabled={checkingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: checkingAll ? '#f3f4f6' : 'rgba(99,102,241,0.06)',
                color: checkingAll ? '#9ca3af' : '#6366f1',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              {checkingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckSquare size={13} />}
              {checkingAll ? 'Checking...' : 'Check all'}
            </button>
          )}
          <button
            onClick={onAddCompany}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <Plus size={14} />Add company
          </button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
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
        <button
          onClick={() => setHasPmOnly((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: hasPmOnly ? 'rgba(99,102,241,0.08)' : '#fff',
            color: hasPmOnly ? '#6366f1' : '#6b7280',
            border: `1px solid ${hasPmOnly ? 'rgba(99,102,241,0.25)' : '#e8e8f4'}`,
          }}
        >
          <Link2 size={13} />
          Has PM roles
        </button>
        <div className="flex items-center gap-1 ml-auto">
          {['default', 'az', 'most'].map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: sort === s ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: sort === s ? '#6366f1' : '#9ca3af',
                border: `1px solid ${sort === s ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
              }}
            >
              {s === 'default' ? 'Relevant' : s === 'az' ? 'A–Z' : 'Most roles'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
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
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e8e8f4' }}>
          {filtered.map((company, idx) => (
            <CompanyRow
              key={company.id}
              company={company}
              companyJobs={jobsForCompany(company.id)}
              isExpanded={expandedId === company.id}
              onToggle={() => setExpandedId(expandedId === company.id ? null : company.id)}
              onEdit={onEditCompany}
              onDelete={onDeleteCompany}
              onAddJob={onAddJob}
              onUpdateCompany={onUpdateCompany}
              isLast={idx === filtered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyRow({ company, companyJobs, isExpanded, onToggle, onEdit, onDelete, onAddJob, onUpdateCompany, isLast }) {
  const [checking, setChecking] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [analyses, setAnalyses] = useState({});

  const positions = company.positions || [];
  const canCheck = !!(company.atsType && company.atsSlug);

  const activeJobs = companyJobs.filter((j) => j.stage !== 'rejected');
  const highestStage = (() => {
    const priority = ['offer', 'interview', 'applied', 'researching', 'saved'];
    for (const s of priority) {
      if (activeJobs.some((j) => j.stage === s)) return STAGES.find((st) => st.id === s);
    }
    return null;
  })();

  const checkedAt = company.atsCheckedAt
    ? (() => {
        const diff = Date.now() - new Date(company.atsCheckedAt).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${days}d ago`;
      })()
    : null;

  const handleCheck = useCallback(async () => {
    if (!canCheck || checking) return;
    setChecking(true);
    const autoFound = await fetchPositionsForCompany(company);
    const manualPositions = positions.filter((p) => p.source === 'manual');
    onUpdateCompany(company.id, {
      positions: [...manualPositions, ...autoFound],
      atsCheckedAt: new Date().toISOString(),
    });
    setChecking(false);
  }, [company, canCheck, checking, positions, onUpdateCompany]);

  const handleRemovePosition = (posId) => {
    onUpdateCompany(company.id, { positions: positions.filter((p) => p.id !== posId) });
  };

  const handleAddManual = () => {
    if (!manualTitle.trim()) return;
    const newPos = {
      id: `manual-${Date.now()}`,
      title: manualTitle.trim(),
      url: manualUrl.trim(),
      source: 'manual',
      foundDate: new Date().toISOString(),
    };
    onUpdateCompany(company.id, { positions: [...positions, newPos] });
    setManualTitle('');
    setManualUrl('');
    setAddingManual(false);
  };

  const analyzePosition = async (pos) => {
    const cvText = localStorage.getItem('scout-cv-text');
    const apiKey = localStorage.getItem('scout-claude-key');
    if (!cvText) return alert('Upload your CV in the Profile tab first.');
    if (!apiKey) return alert('Add your Anthropic API key in the Profile tab first.');
    setAnalyses((a) => ({ ...a, [pos.id]: { loading: true } }));
    try {
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ cvText, jobTitle: pos.title, companyName: company.name, jobSnippet: pos.snippet || '' }),
      });
      const data = await res.json();
      if (data.error) setAnalyses((a) => ({ ...a, [pos.id]: { error: data.error } }));
      else setAnalyses((a) => ({ ...a, [pos.id]: data }));
    } catch (err) {
      setAnalyses((a) => ({ ...a, [pos.id]: { error: err.message } }));
    }
  };

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #f0f0f8' }}>
      {/* Collapsed row — 56px */}
      <div
        className="flex items-center gap-3 px-4 cursor-pointer transition-all"
        style={{ height: 56, background: isExpanded ? '#fafaff' : '#fff' }}
        onClick={onToggle}
        onMouseEnter={(e) => !isExpanded && (e.currentTarget.style.background = '#f9f9ff')}
        onMouseLeave={(e) => !isExpanded && (e.currentTarget.style.background = '#fff')}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.12)' }}
        >
          {company.name[0]}
        </div>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{company.name}</span>
            {company.favorite && <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b', flexShrink: 0 }} />}
          </div>
          <div className="text-xs" style={{ color: '#9ca3af' }}>
            {[company.industry, company.size].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* Stage badge */}
        {highestStage && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
            style={{ background: highestStage.bg, color: highestStage.color, border: `1px solid ${highestStage.border}` }}
          >
            {highestStage.emoji} {highestStage.label}
          </span>
        )}

        {/* PM count chip */}
        {positions.length > 0 && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {positions.length} PM {positions.length === 1 ? 'role' : 'roles'}
          </span>
        )}

        {/* Chevron */}
        <ChevronRight
          size={15}
          style={{
            color: '#9ca3af',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4" style={{ background: '#fafaff', borderTop: '1px solid #f0f0f8' }}>
          <div className="grid grid-cols-2 gap-5 pt-4">
            {/* Left col: Positions + ATS + Add manually */}
            <div>
              {/* ATS check */}
              {canCheck && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={handleCheck}
                    disabled={checking}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: checking ? '#f3f4f6' : 'rgba(99,102,241,0.06)',
                      color: checking ? '#9ca3af' : '#6366f1',
                      border: '1px solid rgba(99,102,241,0.15)',
                    }}
                  >
                    {checking ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    {checking ? 'Checking...' : 'Check ATS'}
                  </button>
                  <span className="text-[10px]" style={{ color: '#9ca3af' }}>
                    {company.atsType === 'lever' ? 'Lever' : company.atsType === 'ashby' ? 'Ashby' : 'Greenhouse'}
                    {checkedAt ? ` · checked ${checkedAt}` : ''}
                  </span>
                </div>
              )}

              {/* Positions list */}
              {positions.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {positions.map((pos) => {
                    const analysis = analyses[pos.id];
                    const scoreColor = analysis?.score >= 80 ? '#22c55e' : analysis?.score >= 60 ? '#f59e0b' : analysis?.score >= 40 ? '#6366f1' : '#ef4444';
                    return (
                      <div key={pos.id} className="rounded-lg p-2.5 group/pos" style={{ background: '#fff', border: '1px solid #ebebf8' }}>
                        <div className="flex items-start gap-1.5 mb-1">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded shrink-0 font-semibold mt-0.5"
                            style={{
                              background: pos.source === 'manual' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                              color: pos.source === 'manual' ? '#f59e0b' : '#6366f1',
                            }}
                          >
                            {pos.source === 'manual' ? 'manual' : pos.source}
                          </span>
                          <div className="flex-1 min-w-0">
                            {pos.url ? (
                              <a href={pos.url} target="_blank" rel="noreferrer"
                                className="text-xs font-semibold leading-tight hover:underline block"
                                style={{ color: '#111827' }} title={pos.title}
                              >{pos.title}</a>
                            ) : (
                              <span className="text-xs font-semibold leading-tight block" style={{ color: '#111827' }}>{pos.title}</span>
                            )}
                            {(pos.team || pos.location || pos.snippet) && (
                              <p className="text-[10px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: '#9ca3af' }}>
                                {pos.team || pos.location
                                  ? [pos.team, pos.location].filter(Boolean).join(' · ')
                                  : pos.snippet}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {pos.url && (
                              <a href={pos.url} target="_blank" rel="noreferrer" style={{ color: '#d1d5db' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                              ><ExternalLink size={10} /></a>
                            )}
                            <button
                              onClick={() => analyzePosition(pos)}
                              disabled={analysis?.loading}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all"
                              style={{
                                background: analysis?.score != null ? `${scoreColor}15` : 'rgba(99,102,241,0.08)',
                                color: analysis?.score != null ? scoreColor : '#6366f1',
                                border: `1px solid ${analysis?.score != null ? `${scoreColor}30` : 'rgba(99,102,241,0.2)'}`,
                              }}
                            >
                              {analysis?.loading ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                              {analysis?.score != null ? `${analysis.score}%` : 'Analyze'}
                            </button>
                            <button
                              onClick={() => handleRemovePosition(pos.id)}
                              className="opacity-0 group-hover/pos:opacity-100 transition-opacity"
                              style={{ color: '#ef4444' }}
                            ><X size={10} /></button>
                          </div>
                        </div>
                        {analysis && !analysis.loading && !analysis.error && (
                          <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid #eaeaf4' }}>
                            <p className="text-[10px] leading-relaxed mb-1" style={{ color: '#374151' }}>{analysis.summary}</p>
                            {analysis.strengths?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {analysis.strengths.map((s, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a' }}>✓ {s}</span>
                                ))}
                                {analysis.gaps?.map((g, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626' }}>✗ {g}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {analysis?.error && (
                          <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>{analysis.error}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add manually */}
              {addingManual ? (
                <div className="flex flex-col gap-1.5 p-2.5 rounded-lg" style={{ background: '#fff', border: '1px solid #e8e8f4' }}>
                  <input
                    autoFocus
                    placeholder="Job title"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="text-xs px-2 py-1.5 rounded"
                    style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', outline: 'none' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                  />
                  <input
                    placeholder="URL (optional)"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="text-xs px-2 py-1.5 rounded"
                    style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', outline: 'none' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                  />
                  <div className="flex gap-1.5">
                    <button onClick={handleAddManual} className="flex-1 text-xs py-1 rounded font-medium"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Save</button>
                    <button onClick={() => { setAddingManual(false); setManualTitle(''); setManualUrl(''); }}
                      className="flex-1 text-xs py-1 rounded" style={{ background: '#f3f4f6', color: '#6b7280' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingManual(true)}
                  className="flex items-center gap-1 text-xs transition-all"
                  style={{ color: '#d1d5db' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                >
                  <Plus size={11} /> Add manually
                </button>
              )}
            </div>

            {/* Right col: Notes + Outreach */}
            <div>
              {company.notes && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium mb-1" style={{ color: '#d1d5db' }}>NOTES</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{company.notes}</p>
                </div>
              )}

              {/* Outreach badges */}
              {(company.linkedinUrl || company.connections || company.referral || company.viaForm || company.email) && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: '#d1d5db' }}>OUTREACH</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {company.linkedinUrl && (
                      <a href={company.linkedinUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(10,102,194,0.08)', color: '#0a66c2', border: '1px solid rgba(10,102,194,0.2)' }}>
                        <Link2 size={9} /> LinkedIn
                      </a>
                    )}
                    {company.connections && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                        <Users size={9} /> {company.connections}
                      </span>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`}
                        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: '#f3f4f6', color: '#6b7280' }}>
                        <Mail size={9} /> Email
                      </a>
                    )}
                    {company.referral && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                        ✓ Referral
                      </span>
                    )}
                    {company.viaForm && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                        ✓ Via form
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center gap-2 mt-4" style={{ borderTop: '1px solid #ebebf8', paddingTop: 12 }}>
                <button
                  onClick={() => onAddJob({ companyId: company.id, company: company.name })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.14)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                >
                  <Kanban size={11} /> Add to pipeline
                </button>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: '#f3f4f6', color: '#6b7280' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}>
                    <ExternalLink size={11} /> Careers page
                  </a>
                )}
                <button
                  onClick={() => onEdit(company)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={() => onDelete(company.id)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
