import { useState, useCallback, useEffect } from 'react';
import { LayoutDashboard, Kanban, Building2, Plus, User } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import { seedJobs, seedCompanies } from './data/seed';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import Companies from './components/Companies';
import Profile from './components/Profile';
import JobModal from './components/JobModal';
import CompanyModal from './components/CompanyModal';

const NAV = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', Icon: Kanban },
  { id: 'companies', label: 'Companies', Icon: Building2 },
  { id: 'profile', label: 'Profile', Icon: User },
];

const defaultProfile = {
  name: '',
  currentRole: '',
  linkedinUrl: '',
  cvUrl: '',
  skills: [],
  yearsExperience: '',
  preferredIndustries: [],
  salaryMin: '',
  salaryMax: '',
  preferredLocations: 'Berlin',
  bio: '',
};

function updateStreak(streakData) {
  const today = new Date().toDateString();
  if (!streakData) return { count: 1, lastDate: today };
  const last = streakData.lastDate;
  if (last === today) return streakData;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (last === yesterday) {
    return { count: streakData.count + 1, lastDate: today };
  }
  return { count: 1, lastDate: today };
}

export default function App() {
  const [jobs, setJobs] = useLocalStorage('scout-jobs-v4', seedJobs);
  const [companies, setCompanies] = useLocalStorage('scout-companies-v5', seedCompanies);
  const [profile, setProfile] = useLocalStorage('scout-profile-v4', defaultProfile);
  const [streakData, setStreakData] = useLocalStorage('scout-streak-v4', null);
  const [achievements, setAchievements] = useLocalStorage('scout-achievements-v4', []);
  const [activeView, setActiveView] = useState('pipeline');
  const [jobModal, setJobModal] = useState({ open: false, job: null });
  const [companyModal, setCompanyModal] = useState({ open: false, company: null });

  const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // One-time migration: fix ATS slugs that were pointing to wrong platforms
  useEffect(() => {
    const key = 'scout-ats-migration-v1';
    if (localStorage.getItem(key)) return;
    const fixes = {
      'c-deepl':   { atsType: 'ashby',      atsSlug: 'DeepL' },
      'c-dataiku': { atsType: 'greenhouse', atsSlug: 'dataiku' },
      'c-pitch':   { atsType: '',           atsSlug: '' },
      'c-upvest':  { atsType: 'ashby',      atsSlug: 'upvest' },
      'c-n8n':     { atsType: 'ashby',      atsSlug: 'n8n' },
    };
    setCompanies((prev) =>
      prev.map((c) => (fixes[c.id] ? { ...c, ...fixes[c.id] } : c))
    );
    localStorage.setItem(key, 'done');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const touchStreak = useCallback(() => {
    setStreakData((prev) => updateStreak(prev));
  }, [setStreakData]);

  const addJob = (data) => {
    setJobs((prev) => [...prev, { ...data, id: genId(), addedDate: new Date().toISOString() }]);
    touchStreak();
  };

  const updateJob = (id, updates) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    touchStreak();
  };

  const deleteJob = (id) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const addCompany = (data) =>
    setCompanies((prev) => [...prev, { ...data, id: genId(), positions: [], atsCheckedAt: null }]);

  const updateCompany = (id, updates) =>
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const deleteCompany = (id) => setCompanies((prev) => prev.filter((c) => c.id !== id));

  const openAddJob = (defaults = {}) => setJobModal({ open: true, job: null, defaults });
  const openEditJob = (job) => setJobModal({ open: true, job });
  const openAddCompany = () => setCompanyModal({ open: true, company: null });
  const openEditCompany = (company) => setCompanyModal({ open: true, company });

  const handleUnlockAchievement = useCallback((ids) => {
    setAchievements((prev) => {
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));
      return [...set];
    });
  }, [setAchievements]);

  const streak = streakData?.count || 0;

  return (
    <div className="min-h-screen" style={{ background: '#f5f5fb' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b"
        style={{ background: 'rgba(255,255,255,0.95)', borderColor: '#e8e8f4', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
          >
            S
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: '#111827' }}>
            Scout
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            Berlin
          </span>
          {streak > 0 && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              🔥 {streak}d
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ id, label, Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: active ? '#6366f1' : '#6b7280',
                  border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={openAddCompany}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <Building2 size={13} />
            Add company
          </button>
          <button
            onClick={() => openAddJob()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={14} />
            Add job
          </button>
        </div>
      </header>

      {/* Main content */}
      <main>
        {activeView === 'dashboard' && (
          <Dashboard
            jobs={jobs}
            companies={companies}
            onEditJob={openEditJob}
            onAddJob={openAddJob}
            streak={streak}
            achievements={achievements}
            onUnlockAchievement={handleUnlockAchievement}
          />
        )}
        {activeView === 'pipeline' && (
          <Pipeline
            jobs={jobs}
            companies={companies}
            onUpdateJob={updateJob}
            onDeleteJob={deleteJob}
            onAddJob={openAddJob}
            onEditJob={openEditJob}
          />
        )}
        {activeView === 'companies' && (
          <Companies
            companies={companies}
            jobs={jobs}
            onAddCompany={openAddCompany}
            onEditCompany={openEditCompany}
            onDeleteCompany={deleteCompany}
            onAddJob={openAddJob}
            onUpdateCompany={updateCompany}
          />
        )}
        {activeView === 'profile' && (
          <Profile
            profile={profile}
            onUpdate={setProfile}
          />
        )}
      </main>

      {/* Modals */}
      {jobModal.open && (
        <JobModal
          job={jobModal.job}
          defaults={jobModal.defaults}
          companies={companies}
          profile={profile}
          onSave={(data) => {
            jobModal.job ? updateJob(jobModal.job.id, data) : addJob(data);
            setJobModal({ open: false, job: null });
          }}
          onClose={() => setJobModal({ open: false, job: null })}
        />
      )}
      {companyModal.open && (
        <CompanyModal
          company={companyModal.company}
          onSave={(data) => {
            companyModal.company ? updateCompany(companyModal.company.id, data) : addCompany(data);
            setCompanyModal({ open: false, company: null });
          }}
          onClose={() => setCompanyModal({ open: false, company: null })}
        />
      )}
    </div>
  );
}
