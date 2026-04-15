import { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { authHeader } from '../lib/authHeader';

export default function CvUploadModal({ profile, onUpdateProfile, onSuccess, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File too large (max 5 MB).'); return; }

    setLoading(true);
    setError('');

    try {
      let body;
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        localStorage.setItem('scout-cv-text', text);
        body = { cvText: text };
      } else {
        const b64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body = { cvBase64: b64 };
      }

      localStorage.setItem('scout-cv-name', file.name);

      const res = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) { setError(data.error); setLoading(false); return; }

      if (!body.cvText) {
        const cvSummary = [
          data.name ? `Name: ${data.name}` : '',
          data.currentRole ? `Current Role: ${data.currentRole}` : '',
          data.yearsExperience ? `Years of Experience: ${data.yearsExperience}` : '',
          data.skills?.length ? `Skills: ${data.skills.join(', ')}` : '',
          data.preferredIndustries?.length ? `Industries: ${data.preferredIndustries.join(', ')}` : '',
          data.bio ? `Summary: ${data.bio}` : '',
        ].filter(Boolean).join('\n');
        localStorage.setItem('scout-cv-text', cvSummary);
      }

      const merged = {
        ...profile,
        name: data.name || profile.name,
        currentRole: data.currentRole || profile.currentRole,
        skills: data.skills?.length ? data.skills : profile.skills,
        yearsExperience: data.yearsExperience || profile.yearsExperience,
        preferredIndustries: data.preferredIndustries?.length ? data.preferredIndustries : profile.preferredIndustries,
        salaryMin: data.salaryMin || profile.salaryMin,
        salaryMax: data.salaryMax || profile.salaryMax,
        bio: data.bio || profile.bio,
      };

      onUpdateProfile(merged);
      setDone(true);
      setTimeout(onSuccess, 900);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'var(--backdrop)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border fade-in"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--surface-5)' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Upload your CV</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>Required for AI features</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-5)'; e.currentTarget.style.color = 'var(--text-1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-4)'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle size={36} style={{ color: '#22c55e' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>CV saved to your profile</p>
              <p className="text-xs text-center" style={{ color: 'var(--text-4)' }}>Running your analysis now...</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>Extracting profile...</p>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border-2 border-dashed flex flex-col items-center gap-2 py-8 cursor-pointer transition-all"
                style={{
                  borderColor: dragging ? '#6366f1' : 'var(--border-2)',
                  background: dragging ? 'rgba(99,102,241,0.04)' : 'var(--surface-2)',
                }}
              >
                <Upload size={22} style={{ color: dragging ? '#6366f1' : 'var(--text-4)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                  {dragging ? 'Drop it here' : 'Drop your CV or click to browse'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-5)' }}>PDF or TXT, max 5 MB</p>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.txt,text/plain" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              {error && <p className="text-xs mt-3" style={{ color: '#ef4444' }}>{error}</p>}
              <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-5)' }}>
                Your CV is stored locally and synced to your account. We never share it.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
