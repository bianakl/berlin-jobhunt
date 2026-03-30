import { useState, useEffect } from 'react';
import { MoreHorizontal, ExternalLink, Pencil, Clock, CalendarClock, AlertCircle, Banknote, ChevronRight, TrendingUp, Loader2, MessageSquare } from 'lucide-react';
import { STAGES } from '../data/seed';
import { CompatRing } from './Dashboard';

function compatScore(compatibility) {
  if (!compatibility) return 0;
  const vals = Object.values(compatibility);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100);
}

function agingDays(job) {
  const ref = job.stageChangedAt || job.addedDate;
  if (!ref) return null;
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
}

function formatFollowUp(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, overdue: true };
  if (d === 0) return { label: 'Follow up today', overdue: false };
  if (d === 1) return { label: 'Follow up tomorrow', overdue: false };
  return { label: `Follow up in ${d}d`, overdue: false };
}

function salaryEstCacheKey(title, company) {
  return `salary-est::${(title || '').toLowerCase()}::${(company || '').toLowerCase()}`;
}

async function fetchSalaryEst(title, company) {
  const apiKey = localStorage.getItem('scout-claude-key');
  const cvText = localStorage.getItem('scout-cv-text');
  if (!cvText) return null;
  const res = await fetch('/api/salary-estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ cvText, jobTitle: title, companyName: company }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export default function JobCard({ job, onEdit, onDelete, onMove, stages }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [salaryEst, setSalaryEst] = useState(() => {
    try { return JSON.parse(localStorage.getItem(salaryEstCacheKey(job.title, job.company)) || 'null'); } catch { return null; }
  });
  const [salaryLoading, setSalaryLoading] = useState(false);

  const handleGetEstimate = async (e) => {
    e.stopPropagation();
    if (salaryLoading) return;
    setSalaryLoading(true);
    const data = await fetchSalaryEst(job.title, job.company);
    if (data && !data.error) {
      setSalaryEst(data);
      localStorage.setItem(salaryEstCacheKey(job.title, job.company), JSON.stringify(data));
    }
    setSalaryLoading(false);
  };
  const score = compatScore(job.compatibility);
  const stage = STAGES.find((s) => s.id === job.stage);
  const followUp = formatFollowUp(job.followUpDate);
  const days = agingDays(job);

  const agingColor = days === null ? null : days >= 14 ? '#ef4444' : days >= 7 ? '#f59e0b' : null;

  // For the Move to next stage menu item
  const stageList = stages || STAGES;
  const currentIdx = stageList.findIndex((s) => s.id === job.stage);
  const currentStageObj = stageList[currentIdx];
  const nextStageCand = stageList[currentIdx + 1];
  const nextStage = currentStageObj && !currentStageObj.terminal && nextStageCand && !nextStageCand.terminal
    ? nextStageCand : null;
  const companyRejectedIdx = stageList.findIndex((s) => s.id === 'company_rejected');
  const canMarkRejected = job.stage !== 'company_rejected' && job.stage !== 'rejected' && companyRejectedIdx >= 0;

  // 1-year reapply indicator for company_rejected stage
  const reapplyChip = job.stage === 'company_rejected' ? (() => {
    const ref = job.stageChangedAt || job.addedDate;
    if (!ref) return null;
    const reapplyDate = new Date(ref);
    reapplyDate.setFullYear(reapplyDate.getFullYear() + 1);
    const eligible = new Date() >= reapplyDate;
    const label = reapplyDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { eligible, label };
  })() : null;

  return (
    <div
      className="rounded-xl border fade-in"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        borderLeft: `3px solid ${stage?.color || 'var(--border)'}`,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Clickable body */}
      <div
        className="px-3.5 pt-3.5 pb-2 cursor-pointer"
        onClick={() => onEdit(job)}
      >
        {/* Row 1: Avatar + Title + Company + Menu */}
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: `${stage?.color}15`, color: stage?.color }}
          >
            {job.company?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-1)' }}>{job.title}</div>
            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>{job.company}</div>
          </div>
          {/* Menu — always visible, stop propagation so click doesn't open modal */}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ background: menuOpen ? 'var(--border-2)' : 'var(--surface-5)', color: 'var(--text-4)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-2)')}
              onMouseLeave={(e) => !menuOpen && (e.currentTarget.style.background = 'var(--surface-5)')}
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 rounded-xl border py-1 min-w-[160px] fade-in"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
              >
                {job.url && (
                  <a
                    href={job.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink size={11} /> View posting
                  </a>
                )}
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
                  onClick={() => { onEdit(job); setMenuOpen(false); }}
                >
                  <Pencil size={11} /> Edit
                </button>
                {nextStage && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
                    onClick={() => { onMove(job.id, 1); setMenuOpen(false); }}
                  >
                    <ChevronRight size={11} /> Move to {nextStage.label}
                  </button>
                )}
                {canMarkRejected && (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                    style={{ color: '#ef4444' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => { onMove(job.id, companyRejectedIdx - currentIdx); setMenuOpen(false); }}
                  >
                    🚫 They rejected me
                  </button>
                )}
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                  style={{ color: 'var(--text-4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onDelete(job.id); setMenuOpen(false); }}
                >
                  Archive
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Stage badge + Aging chip / Reapply chip */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: stage?.bg, color: stage?.color, border: `1px solid ${stage?.border}` }}
          >
            {stage?.emoji} {stage?.label}
          </span>
          {reapplyChip ? (
            <span
              className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: reapplyChip.eligible ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)', color: reapplyChip.eligible ? '#16a34a' : '#ef4444' }}
            >
              {reapplyChip.eligible ? '✓ Can reapply' : `Reapply after ${reapplyChip.label}`}
            </span>
          ) : agingColor && days !== null ? (
            <span
              className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${agingColor}12`, color: agingColor }}
            >
              <Clock size={9} />{days}d in stage
            </span>
          ) : null}
        </div>

        {/* Row 3: Follow-up (only if set) */}
        {followUp && (
          <div
            className="flex items-center gap-1 text-[11px] mb-2 px-2 py-1 rounded"
            style={{
              background: followUp.overdue ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)',
              color: followUp.overdue ? '#ef4444' : '#6366f1',
            }}
          >
            {followUp.overdue ? <AlertCircle size={10} /> : <CalendarClock size={10} />}
            {followUp.label}
          </div>
        )}

        {/* Row 4: Compat ring + Salary + Market estimate + log count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CompatRing score={score} size={28} />
            {job.activityLog?.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-5)' }}>
                <MessageSquare size={9} />{job.activityLog.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {job.salary && (
              <span className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: 'var(--text-4)' }}>
                <Banknote size={10} />{job.salary}
              </span>
            )}
            {salaryEst && !salaryEst.error ? (
              <span
                className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(99,102,241,0.07)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
                title={salaryEst.note || ''}
              >
                <TrendingUp size={9} />{salaryEst.label}
              </span>
            ) : (
              <button
                onClick={handleGetEstimate}
                disabled={salaryLoading}
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded transition-all shrink-0"
                style={{ color: 'var(--text-5)', border: '1px solid transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.background = 'rgba(13,148,136,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-5)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
                title="Get salary estimate for this role"
              >
                {salaryLoading ? <Loader2 size={9} className="animate-spin" /> : <TrendingUp size={9} />}
                {salaryLoading ? '' : '€?'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
