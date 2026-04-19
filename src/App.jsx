import { useState, useCallback, useEffect, useRef } from 'react';
import SyncBanner from './components/SyncBanner';
import ProfileSignInGate from './components/ProfileSignInGate';
import useLocalStorage from './hooks/useLocalStorage';
import { seedJobs, starterPackCompanies, ROLES } from './data/seed';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import Companies from './components/Companies';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import JobModal from './components/JobModal';
import CompanyModal from './components/CompanyModal';
import CvUploadModal from './components/CvUploadModal';
import { supabase } from './lib/supabase';
import { pushToSupabase, pullFromSupabase } from './lib/sync';

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
  const [companies, setCompanies] = useLocalStorage('scout-companies-v5', []);
  const [profile, setProfile] = useLocalStorage('scout-profile-v4', defaultProfile);
  const [streakData, setStreakData] = useLocalStorage('scout-streak-v4', null);
  const [achievements, setAchievements] = useLocalStorage('scout-achievements-v4', []);
  const [activeView, setActiveView] = useState('companies');
  const [jobModal, setJobModal] = useState({ open: false, job: null });
  const [companyModal, setCompanyModal] = useState({ open: false, company: null });
  const [cvModal, setCvModal] = useState(false);
  const pendingCvAction = useRef(null);

  // Dark mode
  const [dark, setDark] = useLocalStorage('scout-dark-mode', false);
  const [targetRole, setTargetRole] = useLocalStorage('scout-target-role', 'pm');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!dark);
  }, [dark]);

  // Sync state
  const [syncUser, setSyncUser] = useState(null); // { id, email } or null
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const debounceTimer = useRef(null);

  // Refs for accessing latest state inside debounced callback
  const stateRef = useRef({});
  stateRef.current = { jobs, companies, profile, streakData, achievements, dark };

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

  // One-time migration: add new ATS configs discovered for Berlin companies
  useEffect(() => {
    const key = 'scout-ats-migration-v2';
    if (localStorage.getItem(key)) return;
    const fixes = {
      'c-aleph-alpha': { atsType: 'personio',       atsSlug: 'alephalpha' },
      'c-deepset':     { atsType: 'personio',       atsSlug: 'deepset' },
      'c-parloa':      { atsType: 'greenhouse',     atsSlug: 'parloa' },
      'c-solarisbank': { atsType: 'greenhouse',     atsSlug: 'solarisbank' },
      'c-spendesk':    { atsType: 'lever',          atsSlug: 'spendesk' },
      'c-taxfix':      { atsType: 'greenhouse',     atsSlug: 'taxfix2' },
      'c-wefox':       { atsType: 'personio',       atsSlug: 'wefox-jobs' },
      'c-about-you':   { atsType: 'smartrecruiters', atsSlug: 'ABOUTYOUGmbH' },
      'c-auto1':       { atsType: 'smartrecruiters', atsSlug: 'Auto1' },
      'c-flink':       { atsType: 'smartrecruiters', atsSlug: 'Flink3' },
      'c-enpal':       { atsType: 'smartrecruiters', atsSlug: 'Enpal' },
      'c-mcmakler':    { atsType: 'smartrecruiters', atsSlug: 'McMakler' },
      'c-mcmakler2':   { atsType: 'smartrecruiters', atsSlug: 'McMakler' },
    };
    setCompanies((prev) =>
      prev.map((c) => (fixes[c.id] && !c.atsType ? { ...c, ...fixes[c.id] } : c))
    );
    localStorage.setItem(key, 'done');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: check for existing session and pull cloud data
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      setSyncUser({ id: session.user.id, email: session.user.email });
      await loadCloudData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSyncUser({ id: session.user.id, email: session.user.email });
        await loadCloudData(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        setSyncUser(null);
        setSyncStatus('idle');
      }
    });

    // Pull fresh data when user returns to the tab (e.g. switch from desktop → mobile)
    const handleFocus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) loadCloudData(session.user.id);
      });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCloudData(userId) {
    setSyncStatus('syncing');
    try {
      const data = await pullFromSupabase(userId);
      if (data) {
        if (data.jobs) setJobs(data.jobs);
        if (Array.isArray(data.companies) && data.companies.length > 0) setCompanies(data.companies);
        if (data.profile) setProfile(data.profile);
        if (data.streak) setStreakData(data.streak);
        if (data.achievements) setAchievements(data.achievements);
        if (data.dark_mode !== undefined) setDark(data.dark_mode);
        if (data.cv_name) localStorage.setItem('scout-cv-name', data.cv_name);
        if (data.cv_text) localStorage.setItem('scout-cv-text', data.cv_text);
        if (data.market_value) localStorage.setItem('scout-market-value', JSON.stringify(data.market_value));
      } else {
        // New authenticated user with no cloud data — push local state so other devices sync
        scheduleSyncFor(userId);
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }

  function scheduleSyncFor(userId) {
    if (!userId) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      const s = stateRef.current;
      setSyncStatus('syncing');
      try {
        await pushToSupabase(userId, {
          jobs: s.jobs,
          companies: s.companies,
          profile: s.profile,
          streak: s.streakData,
          achievements: s.achievements,
          dark_mode: s.dark,
          cv_name: localStorage.getItem('scout-cv-name') || '',
          cv_text: localStorage.getItem('scout-cv-text') || '',
          market_value: (() => {
            try { return JSON.parse(localStorage.getItem('scout-market-value') || 'null'); } catch { return null; }
          })(),
        });
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }, 2000);
  }

  // Wrap syncUser in ref so wrappers can always read current value
  const syncUserRef = useRef(syncUser);
  syncUserRef.current = syncUser;

  const triggerSync = useCallback(() => {
    scheduleSyncFor(syncUserRef.current?.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const touchStreak = useCallback(() => {
    setStreakData((prev) => updateStreak(prev));
  }, [setStreakData]);

  const addJob = (data) => {
    setJobs((prev) => [...prev, { ...data, id: genId(), addedDate: new Date().toISOString() }]);
    touchStreak();
    triggerSync();
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
    triggerSync();
  };

  const deleteJob = (id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    triggerSync();
  };

  const addCompany = (data) => {
    setCompanies((prev) => [...prev, { ...data, id: genId(), positions: [], atsCheckedAt: null }]);
    triggerSync();
  };

  const updateCompany = (id, updates) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    triggerSync();
  };

  const deleteCompany = (id) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    triggerSync();
  };

  const handleSetProfile = (val) => {
    setProfile(val);
    triggerSync();
  };

  const handleToggleDark = () => {
    setDark((d) => !d);
    triggerSync();
  };

  const handleImportStarterPack = (roleId) => {
    if (syncStatus === 'syncing') return;
    // Save chosen role
    if (roleId && ROLES.find((r) => r.id === roleId)) setTargetRole(roleId);
    // ID-based dedup — only add companies not already present
    const existingIds = new Set(companies.map((c) => c.id));
    const toAdd = starterPackCompanies.filter((c) => !existingIds.has(c.id));
    if (toAdd.length === 0) return;
    setCompanies((prev) => [...prev, ...toAdd]);
    // Mark offered so the prompt doesn't reappear if user later empties their list
    localStorage.setItem('scout-starter-pack-offered', 'true');
    triggerSync();
  };

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
    triggerSync();
  }, [setAchievements, triggerSync]);

  const handleSyncRequest = async (email) => {
    const redirectTo = window.location.hostname === 'localhost'
      ? 'https://berlin-jobhunt.vercel.app'
      : window.location.origin;
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
  };

  const streak = streakData?.count || 0;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onAddJob={openAddJob}
        streak={streak}
        achievements={achievements}
        jobs={jobs}
        companies={companies}
        dark={dark}
        onToggleDark={handleToggleDark}
      />

      {/* Main content — desktop gets left margin for sidebar, mobile gets bottom padding for nav */}
      <main className="flex-1 main-content md:ml-[220px]">
        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >S</div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Scout</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-muted)' }}>Berlin</span>
          </div>
          <a href="/hire" target="_blank" rel="noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--text-4)', textDecoration: 'none' }}>made with ❤️ by Biana</a>
        </div>
        {!syncUser && (
          <SyncBanner onSyncRequest={handleSyncRequest} />
        )}
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
            onQuickAddJob={addJob}
            onUpdateCompany={updateCompany}
            syncStatus={syncStatus}
            targetRole={targetRole}
            onRoleChange={setTargetRole}
            onImportStarterPack={
              localStorage.getItem('scout-starter-pack-offered') ? null : handleImportStarterPack
            }
          />
        )}
        {activeView === 'profile' && !syncUser && (
          <ProfileSignInGate onSyncRequest={handleSyncRequest} />
        )}
        {activeView === 'profile' && syncUser && (
          <Profile
            profile={profile}
            onUpdate={handleSetProfile}
            dark={dark}
            onToggleDark={handleToggleDark}
            syncUser={syncUser}
            syncStatus={syncStatus}
            onSyncRequest={handleSyncRequest}
            onSignOut={() => supabase.auth.signOut()}
            onSyncNow={() => scheduleSyncFor(syncUser?.id)}
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
          onNeedCv={(cb) => { pendingCvAction.current = cb || null; setCvModal(true); }}
          onAnalyzed={jobModal.job ? (a) => updateJob(jobModal.job.id, { fitAnalysis: a }) : undefined}
          onSave={(data) => {
            jobModal.job ? updateJob(jobModal.job.id, data) : addJob(data);
            setJobModal({ open: false, job: null });
          }}
          onClose={() => setJobModal({ open: false, job: null })}
        />
      )}
      {cvModal && (
        <CvUploadModal
          profile={profile}
          onUpdateProfile={handleSetProfile}
          onSuccess={() => {
              const action = pendingCvAction.current;
              pendingCvAction.current = null;
              setCvModal(false);
              if (action) setTimeout(action, 150);
            }}
          onClose={() => setCvModal(false)}
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
