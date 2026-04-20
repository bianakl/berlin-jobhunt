import { useState, useCallback, useEffect } from 'react';
import { authHeader } from '../lib/authHeader';
import {
  Star, ExternalLink, Pencil, Trash2, Plus, Building2, Search, RefreshCw, X,
  CheckSquare, Loader2, Link2, Mail, Users, Kanban, Sparkles, ChevronRight,
  FileText, Copy, Check,
} from 'lucide-react';
import { STAGES, ROLES } from '../data/seed';
import { useT } from '../lib/LanguageContext';

const DEFAULT_ROLE = ROLES[0];

async function fetchPositionsForCompany(company, roleRegex) {
  const { atsType, atsSlug } = company;
  if (!atsType || !atsSlug) return [];

  try {
    if (atsType === 'lever') {
      const res = await fetch(`https://api.lever.co/v0/postings/${atsSlug}?mode=json`);
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = Array.isArray(data) ? data : [];
      return jobs
        .filter((j) => roleRegex.test(j.text || ''))
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
        .filter((j) => roleRegex.test(j.title || ''))
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
        .filter((j) => roleRegex.test(j.title || ''))
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
    } else if (atsType === 'smartrecruiters') {
      const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(atsSlug)}/postings`);
      if (!res.ok) return [];
      const data = await res.json();
      const jobs = data.content || data.items || data.jobs || [];
      return (Array.isArray(jobs) ? jobs : [])
        .filter((j) => roleRegex.test(j.name || j.title || ''))
        .map((j) => ({
          id: j.id || String(j.id),
          title: j.name || j.title,
          url: j.ref || `https://jobs.smartrecruiters.com/${atsSlug}/${j.id}`,
          source: 'smartrecruiters',
          snippet: '',
          team: j.department?.label || '',
          location: j.location?.city || '',
          foundDate: new Date().toISOString(),
        }));
    } else if (atsType === 'personio') {
      // Personio XML feed
      const res = await fetch(`https://${encodeURIComponent(atsSlug)}.jobs.personio.de/api/xml?language=en`);
      if (!res.ok) return [];
      const xml = await res.text();
      const results = [];
      const posMatches = xml.matchAll(/<position>([\s\S]*?)<\/position>/gi);
      for (const match of posMatches) {
        const block = match[1];
        const title = (block.match(/<name>([\s\S]*?)<\/name>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const jobId = (block.match(/<job_id>([\s\S]*?)<\/job_id>/i)?.[1] || '').trim();
        const jobUrl = (block.match(/<url>([\s\S]*?)<\/url>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const dept = (block.match(/<department>([\s\S]*?)<\/department>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const loc = (block.match(/<office>([\s\S]*?)<\/office>/i)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        if (title && roleRegex.test(title)) {
          results.push({
            id: `personio-${jobId || Date.now()}-${results.length}`,
            title,
            url: jobUrl || `https://${atsSlug}.jobs.personio.de/job/${jobId}`,
            source: 'personio',
            snippet: '',
            team: dept,
            location: loc,
            foundDate: new Date().toISOString(),
          });
        }
      }
      return results;
    } else if (atsType === 'recruitee') {
      const res = await fetch(`https://${encodeURIComponent(atsSlug)}.recruitee.com/api/offers`);
      if (!res.ok) return [];
      const data = await res.json();
      const offers = data.offers || data.jobs || (Array.isArray(data) ? data : []);
      return (Array.isArray(offers) ? offers : [])
        .filter((j) => roleRegex.test(j.title || j.position || ''))
        .map((j) => ({
          id: j.id ? String(j.id) : `recruitee-${Date.now()}-${Math.random()}`,
          title: j.title || j.position,
          url: j.careers_url || `https://${atsSlug}.recruitee.com/o/${j.slug || j.id}`,
          source: 'recruitee',
          snippet: (j.description || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 160),
          team: j.department || '',
          location: j.location || j.city || '',
          foundDate: new Date().toISOString(),
        }));
    }
  } catch {
    return [];
  }
  return [];
}

export default function Companies({ companies, jobs, onAddCompany, onEditCompany, onDeleteCompany, onAddJob, onQuickAddJob, onUpdateCompany, onImportStarterPack, syncStatus, targetRole, onRoleChange }) {
  const t = useT();
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [hasRoleOnly, setHasRoleOnly] = useState(false);
  const [importRole, setImportRole] = useState(targetRole || 'pm');

  const activeRole = ROLES.find((r) => r.id === targetRole) || DEFAULT_ROLE;
  const roleRegex = activeRole.regex;
  const [sort, setSort] = useState('default');
  const [checkingAll, setCheckingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = companies
    .filter((c) => {
      if (favOnly && !c.favorite) return false;
      if (hasRoleOnly && !(c.positions?.length > 0)) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.industry?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'most') return (b.positions?.length || 0) - (a.positions?.length || 0);
      // tier 0: has active roles  tier 1: searchable/checkable + never searched → top
      // tier 2: already searched but empty → bottom  tier 3: nothing configured + never searched
      const tier = (c) => {
        const active = (c.positions || []).filter((p) => !p.disqualified).length;
        if (active > 0) return 0;
        if ((c.atsType && c.atsSlug && !c.atsCheckedAt) || !c.atsCheckedAt) return 1;
        if (c.atsCheckedAt) return 2;
        return 3;
      };
      const diff = tier(a) - tier(b);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

  const jobsForCompany = (companyId) => jobs.filter((j) => j.companyId === companyId);

  const checkableCompanies = companies.filter((c) => c.atsType && c.atsSlug);
  const crawlableCompanies = companies.filter((c) => !c.atsType || !c.atsSlug);

  const handleCheckAll = async () => {
    setCheckingAll(true);
    const now = new Date().toISOString();

    // ATS companies — run all in parallel
    await Promise.allSettled(
      checkableCompanies.map(async (company) => {
        const autoFound = await fetchPositionsForCompany(company, roleRegex);
        const manualPositions = (company.positions || []).filter((p) => p.source === 'manual');
        onUpdateCompany(company.id, {
          positions: [...manualPositions, ...autoFound],
          atsCheckedAt: now,
        });
      })
    );

    // Non-ATS companies — crawl in batches of 3 to avoid rate limits
    const header = await authHeader();
    const BATCH = 3;
    for (let i = 0; i < crawlableCompanies.length; i += BATCH) {
      await Promise.allSettled(
        crawlableCompanies.slice(i, i + BATCH).map(async (company) => {
          try {
            const res = await fetch('/api/crawl-careers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...header },
              body: JSON.stringify({ companyName: company.name, roleId: targetRole }),
            });
            const data = await res.json();
            const found = Array.isArray(data.positions) ? data.positions : [];
            const manualPositions = (company.positions || []).filter((p) => p.source === 'manual');
            const updates = {
              positions: [...manualPositions, ...found],
              atsCheckedAt: now,
            };
            if (data.detectedAts?.type && data.detectedAts?.slug) {
              updates.atsType = data.detectedAts.type;
              updates.atsSlug = data.detectedAts.slug;
            }
            onUpdateCompany(company.id, updates);
          } catch { /* skip failed companies */ }
        })
      );
    }

    setCheckingAll(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-8 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t('companies_title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
            {t('companies_tracked', { n: companies.length, shown: filtered.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {companies.length > 0 && (
            <button
              onClick={handleCheckAll}
              disabled={checkingAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: checkingAll ? 'var(--surface-5)' : 'rgba(99,102,241,0.06)',
                color: checkingAll ? 'var(--text-4)' : '#6366f1',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              {checkingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />}
              {checkingAll ? t('companies_checking') : t('companies_check_all')}
            </button>
          )}
          <button
            onClick={onAddCompany}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <Plus size={13} /><span className="hidden sm:inline">{t('companies_add')}</span><span className="sm:hidden">{t('companies_add')}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }} />
        <input
          type="text"
          placeholder={t('companies_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setFavOnly((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            background: favOnly ? 'rgba(245,158,11,0.08)' : 'var(--surface)',
            color: favOnly ? '#f59e0b' : 'var(--text-3)',
            border: `1px solid ${favOnly ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
          }}
        >
          <Star size={13} fill={favOnly ? '#f59e0b' : 'none'} />
          {t('companies_favorites')}
        </button>
        <button
          onClick={() => setHasRoleOnly((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            background: hasRoleOnly ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
            color: hasRoleOnly ? '#6366f1' : 'var(--text-3)',
            border: `1px solid ${hasRoleOnly ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
          }}
        >
          <Link2 size={13} />
          {t('companies_has_roles', { role: activeRole.short })}
        </button>
        <select
          value={targetRole || 'pm'}
          onChange={(e) => onRoleChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-3)',
            border: '1px solid var(--border)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {['default', 'az', 'most'].map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: sort === s ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: sort === s ? '#6366f1' : 'var(--text-4)',
                border: `1px solid ${sort === s ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
              }}
            >
              {s === 'default' ? t('companies_sort_relevant') : s === 'az' ? t('companies_sort_az') : t('companies_sort_most')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={32} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
          {companies.length === 0 ? (
            <>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>{t('companies_empty_title')}</p>
              <p className="text-xs mb-5 max-w-xs mx-auto" style={{ color: 'var(--text-4)' }}>
                {t('companies_empty_desc')}
              </p>
              {onImportStarterPack && (
                <div className="flex flex-col items-center gap-3 mb-3">
                  <select
                    value={importRole}
                    onChange={(e) => setImportRole(e.target.value)}
                    className="px-3 py-2 rounded-xl text-sm font-medium"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--text-1)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      outline: 'none',
                      minWidth: 220,
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onImportStarterPack(importRole)}
                    disabled={syncStatus === 'syncing'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff',
                      opacity: syncStatus === 'syncing' ? 0.6 : 1,
                      boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                    }}
                  >
                    <Sparkles size={14} />
                    {syncStatus === 'syncing' ? 'Syncing…' : t('companies_import_btn')}
                  </button>
                </div>
              )}
              <button
                onClick={onAddCompany}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(99,102,241,0.06)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <Plus size={14} /> {t('companies_add_manually')}
              </button>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-4)' }}>{t('companies_no_match')}</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
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
              onQuickAddJob={onQuickAddJob}
              onUpdateCompany={onUpdateCompany}
              isLast={idx === filtered.length - 1}
              roleRegex={roleRegex}
              targetRole={targetRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyRow({ company, companyJobs, isExpanded, onToggle, onEdit, onDelete, onAddJob, onQuickAddJob, onUpdateCompany, isLast, roleRegex, targetRole }) {
  const t = useT();
  const [checking, setChecking] = useState(false);
  const [checkDone, setCheckDone] = useState(null); // null | 'found' | 'none'
  const [crawling, setCrawling] = useState(false);
  const [crawlDone, setCrawlDone] = useState(null); // null | 'found' | 'none' | 'error'
  const [showInlineResults, setShowInlineResults] = useState(false);
  const [salaryEstimates, setSalaryEstimates] = useState({});
  const [addedIds, setAddedIds] = useState(new Set());

  const quickAddToPipeline = (pos) => {
    onQuickAddJob({
      title: pos.title,
      company: company.name,
      companyId: company.id,
      url: pos.url || '',
      stage: 'saved',
      notes: pos.snippet || '',
      location: 'Berlin',
      remote: true,
      tags: [],
      salary: '',
      compatibility: { roleMatch: 0, skillsMatch: 0, culture: 0, compensation: 0, growth: 0 },
    });
    setAddedIds((prev) => new Set([...prev, pos.id]));
  };
  const [addingManual, setAddingManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [analyses, setAnalyses] = useState({});
  const [coverLetters, setCoverLetters] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const positions = company.positions || [];
  const activePositions = positions.filter((p) => !p.disqualified);
  const canCheck = !!(company.atsType && company.atsSlug);

  const activeJobs = companyJobs.filter((j) => j.stage !== 'rejected');
  const highestStage = (() => {
    const priority = ['offer', 'interview', 'applied', 'saved'];
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

  const handleCrawl = useCallback(async () => {
    if (crawling) return;
    setCrawling(true);
    setCrawlDone(null);
    try {
      const res = await fetch('/api/crawl-careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ companyName: company.name, roleId: targetRole }),
      });
      const data = await res.json();
      const found = Array.isArray(data.positions) ? data.positions : [];
      const manualPositions = positions.filter((p) => p.source === 'manual');
      const updates = {
        positions: [...manualPositions, ...found],
        atsCheckedAt: new Date().toISOString(),
      };
      // Auto-configure ATS if detected
      if (data.detectedAts?.type && data.detectedAts?.slug) {
        updates.atsType = data.detectedAts.type;
        updates.atsSlug = data.detectedAts.slug;
      }
      onUpdateCompany(company.id, updates);
      const hasPmRoles = found.filter((p) => !p.disqualified).length > 0;
      setCrawlDone(hasPmRoles ? 'found' : 'none');
      if (hasPmRoles) setShowInlineResults(true);
    } catch {
      setCrawlDone('error');
    }
    setCrawling(false);
    setTimeout(() => setCrawlDone(null), 4000);
  }, [company, crawling, positions, onUpdateCompany]);

  const handleCheck = useCallback(async () => {
    if (!canCheck || checking) return;
    setChecking(true);
    setCheckDone(null);
    const autoFound = await fetchPositionsForCompany(company, roleRegex);
    const manualPositions = positions.filter((p) => p.source === 'manual');
    onUpdateCompany(company.id, {
      positions: [...manualPositions, ...autoFound],
      atsCheckedAt: new Date().toISOString(),
    });
    setChecking(false);
    const found = autoFound.filter((p) => !p.disqualified).length > 0;
    setCheckDone(found ? 'found' : 'none');
    if (found) setShowInlineResults(true);
    setTimeout(() => setCheckDone(null), 3000);
  }, [company, canCheck, checking, positions, onUpdateCompany]);

  const handleDisqualify = (posId) => {
    onUpdateCompany(company.id, { positions: positions.map((p) => p.id === posId ? { ...p, disqualified: true } : p) });
  };

  const handleUndisqualify = (posId) => {
    onUpdateCompany(company.id, { positions: positions.map((p) => p.id === posId ? { ...p, disqualified: false } : p) });
  };

  // Auto-fetch salary estimates when inline panel opens
  useEffect(() => {
    if (!showInlineResults) return;
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) return;
    const toFetch = activePositions.filter((p) => p.source !== 'manual' && !salaryEstimates[p.id]);
    toFetch.forEach(async (pos) => {
      setSalaryEstimates((prev) => ({ ...prev, [pos.id]: { loading: true } }));
      try {
        const res = await fetch('/api/salary-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
          body: JSON.stringify({ cvText, jobTitle: pos.title, companyName: company.name }),
        });
        const data = await res.json();
        setSalaryEstimates((prev) => ({ ...prev, [pos.id]: data.error ? null : data }));
      } catch {
        setSalaryEstimates((prev) => ({ ...prev, [pos.id]: null }));
      }
    });
  }, [showInlineResults]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!cvText) { setAnalyses((a) => ({ ...a, [pos.id]: { error: 'Upload your CV in the Profile tab first.' } })); return; }
    setAnalyses((a) => ({ ...a, [pos.id]: { loading: true } }));
    try {
      const profile = JSON.parse(localStorage.getItem('scout-profile-v4') || '{}');
      const skills = profile.skills || [];
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ cvText, jobTitle: pos.title, companyName: company.name, jobSnippet: pos.snippet || '', skills }),
      });
      const data = await res.json();
      if (data.error) setAnalyses((a) => ({ ...a, [pos.id]: { error: data.error } }));
      else setAnalyses((a) => ({ ...a, [pos.id]: data }));
    } catch (err) {
      setAnalyses((a) => ({ ...a, [pos.id]: { error: err.message } }));
    }
  };

  const draftCoverLetter = async (pos) => {
    const cvText = localStorage.getItem('scout-cv-text');
    if (!cvText) { setCoverLetters((cl) => ({ ...cl, [pos.id]: { error: 'Upload your CV in the Profile tab first.' } })); return; }
    setCoverLetters((cl) => ({ ...cl, [pos.id]: { loading: true } }));
    try {
      const profile = JSON.parse(localStorage.getItem('scout-profile-v4') || '{}');
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          cvText,
          jobTitle: pos.title,
          companyName: company.name,
          jobSnippet: pos.snippet || '',
          candidateName: profile.name || '',
          skills: profile.skills || [],
        }),
      });
      const data = await res.json();
      if (data.error) setCoverLetters((cl) => ({ ...cl, [pos.id]: { error: data.error } }));
      else setCoverLetters((cl) => ({ ...cl, [pos.id]: { letter: data.letter } }));
    } catch (err) {
      setCoverLetters((cl) => ({ ...cl, [pos.id]: { error: err.message } }));
    }
  };

  const copyLetter = (posId, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(posId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-3)' }}>
      {/* Collapsed row — 56px */}
      <div
        className="flex items-center gap-3 px-4 cursor-pointer transition-all"
        style={{ height: 56, background: isExpanded ? 'var(--surface-3)' : 'var(--surface)' }}
        onClick={onToggle}
        onMouseEnter={(e) => !isExpanded && (e.currentTarget.style.background = 'var(--surface-3)')}
        onMouseLeave={(e) => !isExpanded && (e.currentTarget.style.background = 'var(--surface)')}
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
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{company.name}</span>
            {company.favorite && <Star size={11} fill="#f59e0b" style={{ color: '#f59e0b', flexShrink: 0 }} />}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-4)' }}>
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

        {/* Crawl button — for companies without ATS configured */}
        {!canCheck && (
          <div className="flex items-center gap-1.5 shrink-0">
            {company.atsCheckedAt && positions.filter((p) => p.source !== 'manual').length === 0 && (
              <span className="text-[10px]" style={{ color: 'var(--text-5)' }}>{checkedAt}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleCrawl(); }}
              disabled={crawling}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: crawling
                  ? 'var(--surface-5)'
                  : crawlDone === 'found'
                    ? 'rgba(34,197,94,0.12)'
                    : crawlDone === 'none' || crawlDone === 'error'
                      ? 'var(--surface-5)'
                      : activePositions.length > 0
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(99,102,241,0.06)',
                color: crawling
                  ? 'var(--text-4)'
                  : crawlDone === 'found'
                    ? '#16a34a'
                    : crawlDone === 'none' || crawlDone === 'error'
                      ? 'var(--text-4)'
                      : activePositions.length > 0
                        ? '#16a34a'
                        : '#6366f1',
                border: `1px solid ${
                  crawlDone === 'found' || activePositions.length > 0 ? 'rgba(34,197,94,0.2)' :
                  crawlDone === 'none' || crawlDone === 'error' ? 'var(--border-2)' : 'rgba(99,102,241,0.15)'
                }`,
              }}
              title="Search for open PM roles at this company"
            >
              {crawling
                ? <Loader2 size={10} className="animate-spin" />
                : crawlDone === 'found'
                  ? <span style={{ fontSize: 10 }}>✓</span>
                  : crawlDone === 'none'
                    ? <span style={{ fontSize: 10 }}>–</span>
                    : crawlDone === 'error'
                      ? <span style={{ fontSize: 10 }}>!</span>
                      : <Search size={10} />}
              {crawling
                ? t('companies_searching')
                : crawlDone === 'found'
                  ? (() => { const n = activePositions.filter((p) => p.source !== 'manual').length; return t('companies_roles_found', { n, s: n !== 1 ? 's' : '' }); })()
                  : crawlDone === 'none'
                    ? t('companies_none_found')
                    : crawlDone === 'error'
                      ? t('companies_failed')
                      : activePositions.filter((p) => p.source !== 'manual').length > 0
                        ? (() => { const n = activePositions.filter((p) => p.source !== 'manual').length; return t('companies_roles_count', { n, s: n !== 1 ? 's' : '' }); })()
                        : t('companies_scan')}
            </button>
          </div>
        )}

        {/* Inline Check button + last-checked label */}
        {canCheck && (
          <div className="flex items-center gap-1.5 shrink-0">
          {checkedAt && positions.length === 0 && (
            <span className="text-[10px]" style={{ color: 'var(--text-5)' }}>{checkedAt}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleCheck(); }}
            disabled={checking}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: checking
                ? 'var(--surface-5)'
                : checkDone === 'found'
                  ? 'rgba(34,197,94,0.12)'
                  : checkDone === 'none'
                    ? 'var(--surface-5)'
                    : activePositions.length > 0
                      ? 'rgba(34,197,94,0.08)'
                      : 'rgba(99,102,241,0.06)',
              color: checking
                ? 'var(--text-4)'
                : checkDone === 'found'
                  ? '#16a34a'
                  : checkDone === 'none'
                    ? 'var(--text-4)'
                    : activePositions.length > 0
                      ? '#16a34a'
                      : '#6366f1',
              border: `1px solid ${checkDone === 'found' || activePositions.length > 0 ? 'rgba(34,197,94,0.2)' : checkDone === 'none' ? 'var(--border-2)' : 'rgba(99,102,241,0.15)'}`,
              transition: 'all 0.3s',
            }}
            title={checkedAt ? `Last checked ${checkedAt}` : 'Check for PM roles'}
          >
            {checking
              ? <Loader2 size={10} className="animate-spin" />
              : checkDone === 'found'
                ? <span style={{ fontSize: 10 }}>✓</span>
                : checkDone === 'none'
                  ? <span style={{ fontSize: 10 }}>–</span>
                  : <RefreshCw size={10} />}
            {checking
              ? t('companies_checking')
              : checkDone === 'found'
                ? t('companies_roles_found', { n: activePositions.length, s: activePositions.length > 1 ? 's' : '' })
                : checkDone === 'none'
                  ? t('companies_none_found')
                  : activePositions.length > 0
                    ? t('companies_roles_count', { n: activePositions.length, s: activePositions.length > 1 ? 's' : '' })
                    : t('companies_check')}
          </button>
          </div>
        )}

        {/* Chevron */}
        <ChevronRight
          size={15}
          style={{
            color: 'var(--text-4)',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Inline results panel — shown after check, no click required */}
      {showInlineResults && activePositions.filter((p) => p.source !== 'manual').length > 0 && !isExpanded && (
        <div className="px-4 py-3 fade-in" style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--border-3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>
              {(() => { const n = activePositions.filter((p) => p.source !== 'manual').length; return t('companies_roles_found', { n, s: n !== 1 ? 's' : '' }); })()}
            </span>
            <button
              onClick={() => setShowInlineResults(false)}
              className="text-[10px]"
              style={{ color: '#c4b5fd' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#c4b5fd')}
            >
              ✕ dismiss
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {activePositions.filter((p) => p.source !== 'manual').map((pos) => (
              <div
                key={pos.id}
                className="flex flex-col sm:flex-row sm:items-start gap-2 rounded-lg px-3 py-2.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{pos.title}</span>
                    {salaryEstimates[pos.id]?.loading && (
                      <Loader2 size={9} className="animate-spin shrink-0" style={{ color: 'var(--text-5)' }} />
                    )}
                    {salaryEstimates[pos.id] && !salaryEstimates[pos.id].loading && salaryEstimates[pos.id].label && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: 'rgba(99,102,241,0.07)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
                        title={salaryEstimates[pos.id].note || ''}
                      >
                        ~{salaryEstimates[pos.id].label}
                      </span>
                    )}
                  </div>
                  {(pos.snippet || pos.team || pos.location) && (
                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-3)' }}>
                      {[pos.team, pos.location].filter(Boolean).join(' · ') || pos.snippet}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDisqualify(pos.id); }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                    style={{ background: 'var(--surface-5)', color: 'var(--text-4)', border: '1px solid var(--border-2)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-5)'; e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                    title="Mark as not a fit — hides this role"
                  >
                    {t('companies_disqualify')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); quickAddToPipeline(pos); }}
                    disabled={addedIds.has(pos.id)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                    style={{
                      background: addedIds.has(pos.id) ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.08)',
                      color: addedIds.has(pos.id) ? '#16a34a' : '#6366f1',
                      border: `1px solid ${addedIds.has(pos.id) ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)'}`,
                    }}
                    title="Add this specific role to your pipeline"
                  >
                    {addedIds.has(pos.id) ? `✓ ${t('companies_added')}` : `+ ${t('companies_add_to_pipeline')}`}
                  </button>
                  {pos.url && (
                    <a
                      href={pos.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'var(--surface)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      Apply <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4" style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--border-3)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 pt-4">
            {/* Left col: Positions + ATS + Add manually */}
            <div>
              {/* ATS source + last checked (info only) */}
              {canCheck && (
                <p className="text-[10px] mb-3" style={{ color: 'var(--text-4)' }}>
                  {company.atsType === 'lever' ? 'Lever' : company.atsType === 'ashby' ? 'Ashby' : 'Greenhouse'}
                  {checkedAt ? ` · checked ${checkedAt}` : ' · never checked'}
                </p>
              )}

              {/* Positions list */}
              {positions.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {positions.map((pos) => {
                    const analysis = analyses[pos.id];
                    const scoreColor = analysis?.score >= 80 ? '#22c55e' : analysis?.score >= 60 ? '#f59e0b' : analysis?.score >= 40 ? '#6366f1' : '#ef4444';
                    if (pos.disqualified) {
                      return (
                        <div key={pos.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-3)' }}>
                          <span className="text-[11px] line-through flex-1 truncate" style={{ color: 'var(--text-5)' }}>{pos.title}</span>
                          <button
                            onClick={() => handleUndisqualify(pos.id)}
                            className="text-[10px] shrink-0 transition-all"
                            style={{ color: 'var(--text-5)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-5)')}
                          >{t('companies_undo')}</button>
                        </div>
                      );
                    }
                    return (
                      <div key={pos.id} className="rounded-lg p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border-3)' }}>
                        <div className="flex items-start gap-1.5 mb-2">
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
                                style={{ color: 'var(--text-1)' }} title={pos.title}
                              >{pos.title}</a>
                            ) : (
                              <span className="text-xs font-semibold leading-tight block" style={{ color: 'var(--text-1)' }}>{pos.title}</span>
                            )}
                            {(pos.team || pos.location || pos.snippet) && (
                              <p className="text-[10px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: 'var(--text-4)' }}>
                                {pos.team || pos.location
                                  ? [pos.team, pos.location].filter(Boolean).join(' · ')
                                  : pos.snippet}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pos.url && (
                            <a href={pos.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all"
                              style={{ background: 'var(--surface-5)', color: 'var(--text-4)', border: '1px solid var(--border-2)', textDecoration: 'none' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}
                            ><ExternalLink size={9} /> {t('companies_open')}</a>
                          )}
                          <button
                            onClick={() => analyzePosition(pos)}
                            disabled={analysis?.loading}
                            className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all"
                            style={{
                              background: analysis?.score != null ? `${scoreColor}15` : 'rgba(99,102,241,0.08)',
                              color: analysis?.score != null ? scoreColor : '#6366f1',
                              border: `1px solid ${analysis?.score != null ? `${scoreColor}30` : 'rgba(99,102,241,0.2)'}`,
                            }}
                          >
                            {analysis?.loading ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                            {analysis?.score != null ? `${analysis.score}%` : t('companies_analyze')}
                          </button>
                          {(() => {
                            const cl = coverLetters[pos.id];
                            return (
                              <button
                                onClick={() => draftCoverLetter(pos)}
                                disabled={cl?.loading}
                                className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all"
                                style={{
                                  background: cl?.letter ? 'rgba(139,92,246,0.08)' : 'rgba(99,102,241,0.08)',
                                  color: cl?.letter ? '#7c3aed' : '#6366f1',
                                  border: `1px solid ${cl?.letter ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)'}`,
                                }}
                              >
                                {cl?.loading ? <Loader2 size={9} className="animate-spin" /> : <FileText size={9} />}
                                {cl?.letter ? t('companies_redraft') : t('companies_draft_letter')}
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => quickAddToPipeline(pos)}
                            disabled={addedIds.has(pos.id)}
                            className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all"
                            style={{
                              background: addedIds.has(pos.id) ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.08)',
                              color: addedIds.has(pos.id) ? '#16a34a' : '#6366f1',
                              border: `1px solid ${addedIds.has(pos.id) ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)'}`,
                            }}
                          >{addedIds.has(pos.id) ? `✓ ${t('companies_added')}` : `+ ${t('companies_add_to_pipeline')}`}</button>
                          <button
                            onClick={() => handleDisqualify(pos.id)}
                            className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all"
                            style={{ background: 'var(--surface-5)', color: 'var(--text-4)', border: '1px solid var(--border-2)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-5)'; e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                          >{t('companies_disqualify')}</button>
                          <button
                            onClick={() => handleRemovePosition(pos.id)}
                            className="flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] transition-all"
                            style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                          ><X size={9} /></button>
                        </div>
                        {analysis && !analysis.loading && !analysis.error && (
                          <div className="mt-1.5 pt-1.5 space-y-1.5" style={{ borderTop: '1px solid var(--border-3)' }}>
                            {/* Verdict badge */}
                            {analysis.verdict && (
                              <span className="inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{
                                background: analysis.verdict === 'strong match' ? 'rgba(34,197,94,0.1)' : analysis.verdict === 'good match' ? 'rgba(99,102,241,0.1)' : analysis.verdict === 'possible match' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
                                color: analysis.verdict === 'strong match' ? '#16a34a' : analysis.verdict === 'good match' ? '#6366f1' : analysis.verdict === 'possible match' ? '#b45309' : '#dc2626',
                              }}>
                                {analysis.verdict.toUpperCase()}
                              </span>
                            )}
                            {/* Summary */}
                            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{analysis.summary}</p>
                            {/* Strengths + gaps */}
                            {(analysis.strengths?.length > 0 || analysis.gaps?.length > 0) && (
                              <div className="flex flex-wrap gap-1">
                                {analysis.strengths?.map((s, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a' }}>✓ {s}</span>
                                ))}
                                {analysis.gaps?.map((g, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626' }}>✗ {g}</span>
                                ))}
                              </div>
                            )}
                            {/* What to highlight */}
                            {analysis.highlights?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-semibold mb-0.5" style={{ color: 'var(--text-4)' }}>{t('job_lead_with')}</p>
                                <div className="flex flex-wrap gap-1">
                                  {analysis.highlights.map((h, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.07)', color: '#6366f1' }}>→ {h}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Watch outs */}
                            {analysis.watchouts?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-semibold mb-0.5" style={{ color: 'var(--text-4)' }}>{t('job_watch_out')}</p>
                                <div className="flex flex-wrap gap-1">
                                  {analysis.watchouts.map((w, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.08)', color: '#b45309' }}>⚠ {w}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {analysis?.error && (
                          <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>{analysis.error}</p>
                        )}
                        {/* Cover letter */}
                        {(() => {
                          const cl = coverLetters[pos.id];
                          if (!cl || cl.loading) return null;
                          if (cl.error) return <p className="text-[10px] mt-1.5" style={{ color: '#ef4444' }}>{cl.error}</p>;
                          return (
                            <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border-3)' }}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[9px] font-semibold" style={{ color: 'var(--text-4)' }}>COVER LETTER</p>
                                <button
                                  onClick={() => copyLetter(pos.id, cl.letter)}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all"
                                  style={{
                                    background: copiedId === pos.id ? 'rgba(34,197,94,0.1)' : 'var(--surface-5)',
                                    color: copiedId === pos.id ? '#16a34a' : 'var(--text-4)',
                                    border: `1px solid ${copiedId === pos.id ? 'rgba(34,197,94,0.2)' : 'var(--border-2)'}`,
                                  }}
                                >
                                  {copiedId === pos.id ? <Check size={8} /> : <Copy size={8} />}
                                  {copiedId === pos.id ? t('companies_copied') : t('companies_copy')}
                                </button>
                              </div>
                              <div
                                className="text-[10px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto rounded p-2"
                                style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-3)' }}
                              >
                                {cl.letter}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add manually */}
              {addingManual ? (
                <div className="flex flex-col gap-1.5 p-2.5 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <input
                    autoFocus
                    placeholder={t('companies_position_title')}
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="text-xs px-2 py-1.5 rounded"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-1)', outline: 'none' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                  />
                  <input
                    placeholder={t('companies_position_url')}
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="text-xs px-2 py-1.5 rounded"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-1)', outline: 'none' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                  />
                  <div className="flex gap-1.5">
                    <button onClick={handleAddManual} className="flex-1 text-xs py-1 rounded font-medium"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{t('companies_save')}</button>
                    <button onClick={() => { setAddingManual(false); setManualTitle(''); setManualUrl(''); }}
                      className="flex-1 text-xs py-1 rounded" style={{ background: 'var(--surface-5)', color: 'var(--text-3)' }}>{t('companies_cancel')}</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingManual(true)}
                  className="flex items-center gap-1 text-xs transition-all"
                  style={{ color: 'var(--text-5)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-5)')}
                >
                  <Plus size={11} /> {t('companies_add_position')}
                </button>
              )}
            </div>

            {/* Right col: Notes + Outreach */}
            <div>
              {company.notes && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-5)' }}>NOTES</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{company.notes}</p>
                </div>
              )}

              {/* Outreach badges */}
              {(company.linkedinUrl || company.connections || company.referral || company.viaForm || company.email) && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-5)' }}>OUTREACH</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {company.linkedinUrl && (
                      <a href={company.linkedinUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'rgba(10,102,194,0.08)', color: '#0a66c2', border: '1px solid rgba(10,102,194,0.2)' }}>
                        <Link2 size={9} /> LinkedIn
                      </a>
                    )}
                    {company.connections && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-5)', color: 'var(--text-3)' }}>
                        <Users size={9} /> {company.connections}
                      </span>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`}
                        className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--surface-5)', color: 'var(--text-3)' }}>
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
              <div className="flex items-center gap-2 mt-4" style={{ borderTop: '1px solid var(--border-3)', paddingTop: 12 }}>
                <button
                  onClick={() => onAddJob({ companyId: company.id, company: company.name })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}
                  title="Add a job manually (opens form)"
                >
                  <Kanban size={11} /> {t('job_add')}
                </button>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'var(--surface-5)', color: 'var(--text-3)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}>
                    <ExternalLink size={11} /> Careers page
                  </a>
                )}
                <button
                  onClick={() => onEdit(company)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}
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
