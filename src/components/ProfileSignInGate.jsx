import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function ProfileSignInGate({ onSyncRequest }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      await onSyncRequest(email.trim());
      setSent(true);
    } catch {
      setError('Could not send link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
      >
        🔒
      </div>
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>
        Sign in to access your profile
      </h2>
      <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
        Your profile, CV, and settings are saved to your account.
      </p>

      {sent ? (
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#22c55e' }}>
          <CheckCircle size={16} /> Check your inbox for the sign-in link.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full text-sm rounded-xl px-4 py-2.5"
            style={{
              background: 'var(--surface)',
              border: `1px solid ${error ? '#ef4444' : 'rgba(99,102,241,0.3)'}`,
              color: 'var(--text-1)',
              outline: 'none',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
            onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(99,102,241,0.3)')}
          />
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '1'; }}
          >
            <Send size={13} /> {loading ? 'Sending…' : 'Send sign-in link'}
          </button>
        </div>
      )}
    </div>
  );
}
