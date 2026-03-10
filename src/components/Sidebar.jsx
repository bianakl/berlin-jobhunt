import { useMemo } from 'react';
import { LayoutDashboard, Kanban, Building2, User, Plus } from 'lucide-react';
import { STAGES } from '../data/seed';

const MILESTONES = [5, 10, 20, 50];

function getLevel(count) {
  if (count >= 50) return { name: 'Berlin Boss', emoji: '🏆', min: 50, max: Infinity };
  if (count >= 30) return { name: 'Pro', emoji: '💎', min: 30, max: 50 };
  if (count >= 15) return { name: 'Hunter', emoji: '🎯', min: 15, max: 30 };
  if (count >= 5) return { name: 'Networker', emoji: '🤝', min: 5, max: 15 };
  return { name: 'Rookie', emoji: '🌱', min: 0, max: 5 };
}

const NAV = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', Icon: Kanban },
  { id: 'companies', label: 'Companies', Icon: Building2 },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function Sidebar({ activeView, onNavigate, onAddJob, streak, achievements, jobs, companies }) {
  const activeJobs = jobs.filter((j) => j.stage !== 'rejected');
  const appliedCount = jobs.filter((j) => ['applied', 'interview', 'offer'].includes(j.stage)).length;
  const level = getLevel(appliedCount);

  const levelPct = level.max === Infinity
    ? 100
    : Math.round(((appliedCount - level.min) / (level.max - level.min)) * 100);

  const next = MILESTONES.find((m) => m > appliedCount) || null;

  const navBadges = useMemo(() => ({
    pipeline: activeJobs.length,
    companies: companies.length,
  }), [activeJobs.length, companies.length]);

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-30 border-r"
      style={{ width: 220, background: '#fff', borderColor: '#e8e8f4' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
        >
          S
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: '#111827' }}>Scout</span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          Berlin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2">
        {NAV.map(({ id, label, Icon }) => {
          const active = activeView === id;
          const badge = navBadges[id];
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left w-full"
              style={{
                background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: active ? '#6366f1' : '#6b7280',
                borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = '#f9f9ff'; e.currentTarget.style.color = '#374151'; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
            >
              <Icon size={15} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(99,102,241,0.15)' : '#f3f4f6',
                    color: active ? '#6366f1' : '#9ca3af',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Gamification mini-widget */}
      <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: '#f9f9ff', border: '1px solid #ebebf8' }}>
        {/* Streak + Level row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{streak > 0 ? '🔥' : '💤'}</span>
            <span className="text-xs font-bold" style={{ color: streak > 0 ? '#f59e0b' : '#d1d5db' }}>
              {streak}d
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{level.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: '#6366f1' }}>{level.name}</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mb-1.5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e8e8f4' }}>
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(levelPct, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
            />
          </div>
        </div>
        <p className="text-[10px]" style={{ color: '#9ca3af' }}>
          {next ? `${appliedCount}/${next} to next level` : 'Max level!'}
        </p>
      </div>

      {/* Add Job button */}
      <div className="px-3 pb-4">
        <button
          onClick={() => onAddJob()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={15} />
          Add Job
        </button>
      </div>
    </aside>
  );
}
