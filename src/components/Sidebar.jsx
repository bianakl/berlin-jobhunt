import { useMemo } from 'react';
import { LayoutDashboard, Kanban, Building2, User, Plus, Sun, Moon } from 'lucide-react';
import { STAGES } from '../data/seed';

const MILESTONES = [5, 10, 20, 50];

function getLevel(count) {
  if (count >= 50) return { name: 'Berlin Boss', emoji: '🏆', min: 50, max: Infinity };
  if (count >= 30) return { name: 'Pro', emoji: '💎', min: 30, max: 50 };
  if (count >= 15) return { name: 'Hunter', emoji: '🎯', min: 15, max: 30 };
  if (count >= 5)  return { name: 'Networker', emoji: '🤝', min: 5, max: 15 };
  return { name: 'Rookie', emoji: '🌱', min: 0, max: 5 };
}

const NAV = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'pipeline',  label: 'Pipeline', Icon: Kanban },
  { id: 'companies', label: 'Companies', Icon: Building2 },
  { id: 'profile',   label: 'Profile',  Icon: User },
];

export default function Sidebar({ activeView, onNavigate, onAddJob, streak, achievements, jobs, companies, dark, onToggleDark }) {
  const activeJobs    = jobs.filter((j) => j.stage !== 'rejected' && j.stage !== 'company_rejected');
  const appliedCount  = jobs.filter((j) => ['applied', 'interview', 'offer'].includes(j.stage)).length;
  const level         = getLevel(appliedCount);
  const levelPct      = level.max === Infinity ? 100 : Math.round(((appliedCount - level.min) / (level.max - level.min)) * 100);
  const next          = MILESTONES.find((m) => m > appliedCount) || null;

  const navBadges = useMemo(() => ({
    pipeline:  activeJobs.length,
    companies: companies.length,
  }), [activeJobs.length, companies.length]);

  /* ── Desktop sidebar ─────────────────────────────────── */
  return (
    <>
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen flex-col z-30 border-r"
        style={{ width: 220, background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Logo */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              S
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-1)' }}>Scout</span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-muted)' }}
            >
              Berlin
            </span>
          </div>
          <a href="/hire" target="_blank" rel="noreferrer" className="text-[10px] mt-1 ml-9 hover:underline" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>made with ❤️ by Biana</a>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map(({ id, label, Icon }) => {
            const active = activeView === id;
            const badge  = navBadges[id];
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left w-full"
                style={{
                  background:  active ? 'var(--accent-faint)' : 'transparent',
                  color:       active ? 'var(--accent)' : 'var(--text-3)',
                  borderLeft:  active ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
              >
                <Icon size={15} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'var(--accent-muted)' : 'var(--surface-5)', color: active ? 'var(--accent)' : 'var(--text-4)' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Gamification mini-widget */}
        <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: 'var(--surface-4)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{streak > 0 ? '🔥' : '💤'}</span>
              <span className="text-xs font-bold" style={{ color: streak > 0 ? '#f59e0b' : 'var(--text-5)' }}>{streak}d</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{level.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{level.name}</span>
            </div>
          </div>
          <div className="mb-1.5">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(levelPct, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }}
              />
            </div>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>
            {next ? `${appliedCount}/${next} to next level` : 'Max level!'}
          </p>
        </div>

        {/* Dark mode toggle + Add Job */}
        <div className="px-3 pb-4 flex flex-col gap-2">
          <button
            onClick={onToggleDark}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border-2)' }}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={() => onAddJob()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={15} /> Add Job
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center"
        style={{ height: 60, background: 'var(--surface)', borderTop: '2px solid var(--border-2)' }}
      >
        {/* Left 2: Overview, Pipeline */}
        {NAV.slice(0, 2).map(({ id, Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all"
              style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">
                {id === 'dashboard' ? 'Overview' : 'Pipeline'}
              </span>
            </button>
          );
        })}
        {/* Center gap for floating + button */}
        <div className="w-14 shrink-0" />
        {/* Right 2: Companies, Profile */}
        {NAV.slice(2).map(({ id, Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all"
              style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">
                {id === 'companies' ? 'Companies' : 'Profile'}
              </span>
            </button>
          );
        })}
        {/* Center add button */}
        <button
          onClick={() => onAddJob()}
          className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', bottom: 18 }}
        >
          <Plus size={20} />
        </button>
      </nav>
    </>
  );
}
