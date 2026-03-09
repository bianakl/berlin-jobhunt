import { useState } from 'react';
import { LayoutDashboard, Kanban, Building2, Plus } from 'lucide-react';
import useLocalStorage from './hooks/useLocalStorage';
import { seedJobs, seedCompanies } from './data/seed';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import Companies from './components/Companies';
import JobModal from './components/JobModal';
import CompanyModal from './components/CompanyModal';

const NAV = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', Icon: Kanban },
  { id: 'companies', label: 'Companies', Icon: Building2 },
];

export default function App() {
  const [jobs, setJobs] = useLocalStorage('scout-jobs-v3', seedJobs);
  const [companies, setCompanies] = useLocalStorage('scout-companies-v3', seedCompanies);
  const [activeView, setActiveView] = useState('pipeline');
  const [jobModal, setJobModal] = useState({ open: false, job: null });
  const [companyModal, setCompanyModal] = useState({ open: false, company: null });

  const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const addJob = (data) =>
    setJobs((prev) => [...prev, { ...data, id: genId(), addedDate: new Date().toISOString() }]);

  const updateJob = (id, updates) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));

  const deleteJob = (id) => setJobs((prev) => prev.filter((j) => j.id !== id));

  const addCompany = (data) =>
    setCompanies((prev) => [...prev, { ...data, id: genId() }]);

  const updateCompany = (id, updates) =>
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const deleteCompany = (id) => setCompanies((prev) => prev.filter((c) => c.id !== id));

  const openAddJob = (defaults = {}) => setJobModal({ open: true, job: null, defaults });
  const openEditJob = (job) => setJobModal({ open: true, job });
  const openAddCompany = () => setCompanyModal({ open: true, company: null });
  const openEditCompany = (company) => setCompanyModal({ open: true, company });

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
          />
        )}
      </main>

      {/* Modals */}
      {jobModal.open && (
        <JobModal
          job={jobModal.job}
          defaults={jobModal.defaults}
          companies={companies}
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
