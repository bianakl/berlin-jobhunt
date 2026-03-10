import { useState, useCallback, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { seedJobs, seedCompanies } from './data/seed';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import Companies from './components/Companies';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import JobModal from './components/JobModal';
import CompanyModal from './components/CompanyModal';

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
    setJobs((prev) => prev.map((j) => {
      if (j.id !== id) return j;
      const stageChanged = updates.stage && updates.stage !== j.stage;
      return {
        ...j,
        ...updates,
        ...(stageChanged ? { stageChangedAt: new Date().toISOString() } : {}),
      };
    }));
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
    <div className="flex min-h-screen" style={{ background: '#f5f5fb' }}>
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onAddJob={openAddJob}
        streak={streak}
        achievements={achievements}
        jobs={jobs}
        companies={companies}
      />

      {/* Main content */}
      <main className="flex-1" style={{ marginLeft: 220 }}>
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
