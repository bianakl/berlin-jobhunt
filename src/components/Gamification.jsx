import { useMemo } from 'react';

const MILESTONES = [5, 10, 20, 50];

function getLevel(count) {
  if (count >= 50) return { name: 'Berlin Boss', emoji: '🏆', min: 50, max: Infinity };
  if (count >= 30) return { name: 'Pro', emoji: '💎', min: 30, max: 50 };
  if (count >= 15) return { name: 'Hunter', emoji: '🎯', min: 15, max: 30 };
  if (count >= 5) return { name: 'Networker', emoji: '🤝', min: 5, max: 15 };
  return { name: 'Rookie', emoji: '🌱', min: 0, max: 5 };
}

function nextMilestone(count) {
  return MILESTONES.find((m) => m > count) || null;
}

const BADGE_DEFS = [
  { id: 'first_apply', emoji: '📬', label: 'First Apply', desc: 'Applied to your first job', check: (jobs) => jobs.some((j) => ['applied', 'interview', 'offer'].includes(j.stage)) },
  { id: 'interview_secured', emoji: '💬', label: 'Interview Secured', desc: 'Got your first interview', check: (jobs) => jobs.some((j) => j.stage === 'interview') },
  { id: 'offer_received', emoji: '🎉', label: 'Offer Received', desc: 'Received an offer', check: (jobs) => jobs.some((j) => j.stage === 'offer') },
  { id: 'ten_companies', emoji: '🏢', label: '10 Companies Tracked', desc: 'Tracking 10+ companies', check: (_jobs, companies) => companies.length >= 10 },
  { id: 'pipeline_starter', emoji: '🚀', label: 'Pipeline Starter', desc: 'Added 5 jobs to your pipeline', check: (jobs) => jobs.length >= 5 },
  { id: 'researcher', emoji: '🔍', label: 'Researcher', desc: 'Put 3+ jobs in Researching', check: (jobs) => jobs.filter((j) => j.stage === 'researching').length >= 3 },
  { id: 'week_streak', emoji: '🔥', label: 'On Fire', desc: '7-day streak', check: (_j, _c, streak) => streak >= 7 },
];

export default function Gamification({ jobs, companies, streak, achievements, onUnlockAchievement }) {
  const appliedCount = jobs.filter((j) => ['applied', 'interview', 'offer'].includes(j.stage)).length;
  const level = getLevel(appliedCount);
  const next = nextMilestone(appliedCount);

  const levelPct = level.max === Infinity
    ? 100
    : Math.round(((appliedCount - level.min) / (level.max - level.min)) * 100);

  const earnedBadges = useMemo(() => {
    const earned = new Set(achievements);
    const newlyEarned = [];
    for (const badge of BADGE_DEFS) {
      if (!earned.has(badge.id) && badge.check(jobs, companies, streak)) {
        newlyEarned.push(badge.id);
      }
    }
    if (newlyEarned.length > 0) {
      onUnlockAchievement(newlyEarned);
    }
    return new Set([...earned, ...newlyEarned]);
  }, [jobs, companies, streak, achievements, onUnlockAchievement]);

  return (
    <div className="rounded-xl border p-5" style={{ background: '#fff', borderColor: '#e8e8f4' }}>
      <h2 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Progress</h2>

      {/* Streak + Level */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Streak */}
        <div className="rounded-xl p-3.5 text-center" style={{ background: streak > 0 ? 'rgba(245,158,11,0.06)' : '#f9fafb', border: `1px solid ${streak > 0 ? 'rgba(245,158,11,0.2)' : '#e5e7eb'}` }}>
          <div className="text-2xl mb-0.5">{streak > 0 ? '🔥' : '💤'}</div>
          <div className="text-lg font-bold" style={{ color: streak > 0 ? '#f59e0b' : '#d1d5db' }}>{streak}</div>
          <div className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>day streak</div>
        </div>

        {/* Level */}
        <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="text-2xl mb-0.5">{level.emoji}</div>
          <div className="text-xs font-bold" style={{ color: '#6366f1' }}>{level.name}</div>
          <div className="text-[10px]" style={{ color: '#9ca3af' }}>{appliedCount} applications</div>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#9ca3af' }}>
            {next ? `Next: ${next} applications` : 'Max level reached!'}
          </span>
          <span className="text-xs font-medium" style={{ color: '#6366f1' }}>
            {level.max === Infinity ? '100%' : `${levelPct}%`}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(levelPct, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
          />
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-[10px] font-medium mb-2" style={{ color: '#d1d5db' }}>ACHIEVEMENTS</p>
        <div className="flex flex-wrap gap-2">
          {BADGE_DEFS.map((badge) => {
            const earned = earnedBadges.has(badge.id);
            return (
              <div
                key={badge.id}
                title={badge.desc}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                style={{
                  background: earned ? 'rgba(99,102,241,0.08)' : '#f3f4f6',
                  color: earned ? '#6366f1' : '#d1d5db',
                  border: `1px solid ${earned ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                  filter: earned ? 'none' : 'grayscale(1) opacity(0.5)',
                }}
              >
                <span style={{ fontSize: 14 }}>{badge.emoji}</span>
                <span className="font-medium">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
