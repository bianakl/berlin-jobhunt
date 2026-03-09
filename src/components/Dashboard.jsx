import { STAGES } from '../data/seed';
import { CalendarClock, TrendingUp, Briefcase, Building2, Star, AlertCircle } from 'lucide-react';

function compatScore(compatibility) {
  if (!compatibility) return 0;
  const vals = Object.values(compatibility);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 5)) * 100);
}

function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const d = Math.ceil(diff / 86400000);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return `in ${d}d`;
}

export default function Dashboard({ jobs, companies, onEditJob, onAddJob }) {
  const activeJobs = jobs.filter((j) => j.stage !== 'rejected');
  const applied = jobs.filter((j) => ['applied', 'interview', 'offer'].includes(j.stage));
  const interviews = jobs.filter((j) => j.stage === 'interview');
  const offers = jobs.filter((j) => j.stage === 'offer');
  const avgCompat = activeJobs.length
    ? Math.round(activeJobs.reduce((sum, j) => sum + compatScore(j.compatibility), 0) / activeJobs.length)
    : 0;

  const followUps = jobs
    .filter((j) => j.followUpDate && j.stage !== 'rejected' && j.stage !== 'offer')
    .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
    .slice(0, 5);

  const recentJobs = [...jobs]
    .filter((j) => j.addedDate)
    .sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
    .slice(0, 5);

  const stageCounts = STAGES.map((s) => ({
    ...s,
    count: jobs.filter((j) => j.stage === s.id).length,
  }));

  const statCards = [
    { label: 'Tracking', value: activeJobs.length, sub: `${jobs.length} total`, icon: Briefcase, color: '#6366f1' },
    { label: 'Applied', value: applied.length, sub: `${interviews.length} in interview`, icon: TrendingUp, color: '#f59e0b' },
    { label: 'Offers', value: offers.length, sub: offers.length === 0 ? 'Keep going!' : 'Nice work!', icon: Star, color: '#22c55e' },
    { label: 'Avg match', value: `${avgCompat}%`, sub: avgCompat >= 70 ? 'Strong fits' : 'Explore more', icon: TrendingUp, color: '#a855f7' },
    { label: 'Companies', value: companies.length, sub: `${companies.filter((c) => c.favorite).length} favorited`, icon: Building2, color: '#06b6d4' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#111827' }}>Your Berlin Job Search</h1>
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          {activeJobs.length === 0
            ? 'Nothing tracked yet — add your first job to get started.'
            : `${activeJobs.length} active ${activeJobs.length === 1 ? 'opportunity' : 'opportunities'} in your pipeline.`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 border"
            style={{ background: '#fff', borderColor: '#e8e8f4' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>{label}</span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={12} style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: '#111827' }}>{value}</div>
            <div className="text-xs" style={{ color: '#d1d5db' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Pipeline mini view */}
        <div className="col-span-2 rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Pipeline</h2>
          <div className="space-y-2">
            {stageCounts.map((s) => {
              const pct = jobs.length ? (s.count / jobs.length) * 100 : 0;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-xs w-24 shrink-0" style={{ color: '#9ca3af' }}>
                    {s.emoji} {s.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#f3f4f6' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <span className="text-xs w-4 text-right font-medium" style={{ color: s.count ? s.color : '#d1d5db' }}>
                    {s.count}
                  </span>
                </div>
              );
            })}
          </div>

          {recentJobs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-medium mb-3" style={{ color: '#d1d5db' }}>Recently added</h3>
              <div className="space-y-1">
                {recentJobs.map((job) => {
                  const score = compatScore(job.compatibility);
                  const stage = STAGES.find((s) => s.id === job.stage);
                  return (
                    <button
                      key={job.id}
                      onClick={() => onEditJob(job)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
                      style={{ background: 'transparent', border: '1px solid transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9f9ff'; e.currentTarget.style.borderColor = '#e8e8f4'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: `${stage?.color}15`, color: stage?.color }}
                      >
                        {job.company?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: '#111827' }}>{job.title}</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>{job.company} · {daysAgo(job.addedDate)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{ background: stage?.bg, color: stage?.color, border: `1px solid ${stage?.border}` }}
                        >
                          {stage?.emoji} {stage?.label}
                        </span>
                        <CompatRing score={score} size={28} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Follow-up sidebar */}
        <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={14} style={{ color: '#6366f1' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>Follow-ups</h2>
          </div>
          {followUps.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">📅</div>
              <p className="text-xs" style={{ color: '#d1d5db' }}>No follow-ups scheduled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {followUps.map((job) => {
                const overdue = isOverdue(job.followUpDate);
                const stage = STAGES.find((s) => s.id === job.stage);
                return (
                  <button
                    key={job.id}
                    onClick={() => onEditJob(job)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: overdue ? 'rgba(239,68,68,0.04)' : 'transparent',
                      border: `1px solid ${overdue ? 'rgba(239,68,68,0.15)' : 'transparent'}`,
                    }}
                    onMouseEnter={(e) => !overdue && (e.currentTarget.style.background = '#f9f9ff')}
                    onMouseLeave={(e) => !overdue && (e.currentTarget.style.background = 'transparent')}
                  >
                    {overdue && <AlertCircle size={12} style={{ color: '#ef4444', marginTop: 2 }} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>{job.title}</div>
                      <div className="text-xs truncate" style={{ color: '#9ca3af' }}>{job.company}</div>
                      <div className="text-xs font-medium mt-0.5" style={{ color: overdue ? '#ef4444' : '#6366f1' }}>
                        {daysUntil(job.followUpDate)}
                      </div>
                    </div>
                    <span className="text-xs px-1 py-0.5 rounded shrink-0" style={{ background: stage?.bg, color: stage?.color }}>
                      {stage?.emoji}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div
            className="mt-5 p-3 rounded-lg text-center"
            style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}
          >
            <div className="text-lg mb-1">🐻</div>
            <p className="text-xs" style={{ color: '#6366f1' }}>
              Berlin is yours.<br />Keep pushing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompatRing({ score, size = 36 }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#6366f1' : '#ef4444';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e8f4" strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={3}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
