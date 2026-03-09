import { useState } from 'react';
import { STAGES } from '../data/seed';
import { CompatRing } from './Dashboard';
import {
  Plus, MoreHorizontal, ExternalLink, Pencil, Trash2,
  ChevronRight, ChevronLeft, CalendarClock, MapPin, Banknote, AlertCircle
} from 'lucide-react';

function compatScore(compatibility) {
  if (!compatibility) return 0;
  const vals = Object.values(compatibility);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return '1d';
  return `${d}d`;
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

function JobCard({ job, stageIndex, totalStages, onEdit, onDelete, onMove }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const score = compatScore(job.compatibility);
  const stage = STAGES.find((s) => s.id === job.stage);
  const followUp = formatFollowUp(job.followUpDate);
  const added = daysSince(job.addedDate);

  const canMoveLeft = stageIndex > 0;
  const canMoveRight = stageIndex < totalStages - 2;

  return (
    <div
      className="rounded-xl border p-3.5 group relative fade-in"
      style={{
        background: '#fff',
        borderColor: '#e8e8f4',
        borderLeft: `3px solid ${stage?.color}`,
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Top row */}
      <div className="flex items-start gap-2.5 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{ background: `${stage?.color}12`, color: stage?.color }}
        >
          {job.company?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight truncate" style={{ color: '#111827' }}>{job.title}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{job.company}</div>
        </div>
        <CompatRing score={score} size={30} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {job.location && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#9ca3af' }}>
            <MapPin size={10} />{job.location}
          </span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#9ca3af' }}>
            <Banknote size={10} />{job.salary}
          </span>
        )}
      </div>

      {/* Tags */}
      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {job.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#9ca3af' }}>+{job.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Follow-up */}
      {followUp && (
        <div
          className="flex items-center gap-1 text-[11px] mb-2.5 px-2 py-1 rounded"
          style={{
            background: followUp.overdue ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)',
            color: followUp.overdue ? '#ef4444' : '#6366f1',
          }}
        >
          {followUp.overdue ? <AlertCircle size={10} /> : <CalendarClock size={10} />}
          {followUp.label}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px]" style={{ color: '#d1d5db' }}>Added {added}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canMoveLeft && (
            <button
              onClick={() => onMove(job.id, -1)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ background: '#f3f4f6' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              title="Move back"
            >
              <ChevronLeft size={12} style={{ color: '#6b7280' }} />
            </button>
          )}
          {canMoveRight && (
            <button
              onClick={() => onMove(job.id, 1)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ background: '#f3f4f6' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              title="Move forward"
            >
              <ChevronRight size={12} style={{ color: '#6b7280' }} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ background: menuOpen ? '#e5e7eb' : '#f3f4f6' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseLeave={(e) => !menuOpen && (e.currentTarget.style.background = '#f3f4f6')}
            >
              <MoreHorizontal size={12} style={{ color: '#6b7280' }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 bottom-8 z-20 rounded-xl border py-1 min-w-[140px] fade-in"
                style={{ background: '#fff', borderColor: '#e8e8f4', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
              >
                {job.url && (
                  <a
                    href={job.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                    style={{ color: '#6b7280' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink size={11} /> View posting
                  </a>
                )}
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                  onClick={() => { onEdit(job); setMenuOpen(false); }}
                >
                  <Pencil size={11} /> Edit
                </button>
                <div style={{ borderTop: '1px solid #e8e8f4', margin: '4px 0' }} />
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-all"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onDelete(job.id); setMenuOpen(false); }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StageColumn({ stage, stageIndex, jobs, totalStages, onEdit, onDelete, onMove, onAddJob }) {
  const stageJobs = jobs.filter((j) => j.stage === stage.id);

  return (
    <div className="flex flex-col shrink-0" style={{ width: 272 }}>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 border"
        style={{ background: stage.bg, borderColor: stage.border }}
      >
        <span>{stage.emoji}</span>
        <span className="text-sm font-semibold" style={{ color: stage.color }}>{stage.label}</span>
        <span
          className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: `${stage.color}20`, color: stage.color }}
        >
          {stageJobs.length}
        </span>
        {stage.id !== 'rejected' && (
          <button
            onClick={() => onAddJob({ stage: stage.id })}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: stage.color }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${stage.color}20`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {stageJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            stageIndex={stageIndex}
            totalStages={totalStages}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
        {stageJobs.length === 0 && (
          <div
            className="rounded-xl border-2 border-dashed p-6 text-center"
            style={{ borderColor: `${stage.color}25` }}
          >
            <p className="text-xs" style={{ color: '#d1d5db' }}>Nothing here yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pipeline({ jobs, companies, onUpdateJob, onDeleteJob, onAddJob, onEditJob }) {
  const handleMove = (id, direction) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const currentIdx = STAGES.findIndex((s) => s.id === job.stage);
    const newStage = STAGES[currentIdx + direction];
    if (!newStage) return;
    const updates = { stage: newStage.id };
    if (newStage.id === 'applied' && !job.appliedDate) {
      updates.appliedDate = new Date().toISOString();
    }
    onUpdateJob(id, updates);
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>Pipeline</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} tracked across {STAGES.length} stages
          </p>
        </div>
        <button
          onClick={() => onAddJob({})}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.14)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
        >
          <Plus size={14} />Add job
        </button>
      </div>

      <div className="pipeline-scroll pb-6">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {STAGES.map((stage, idx) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              stageIndex={idx}
              jobs={jobs}
              totalStages={STAGES.length}
              onEdit={onEditJob}
              onDelete={onDeleteJob}
              onMove={handleMove}
              onAddJob={onAddJob}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
