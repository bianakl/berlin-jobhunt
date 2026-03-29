import { useState } from 'react';
import { Cloud, Send, CheckCircle, X } from 'lucide-react';

export default function SyncBanner({ onSyncRequest }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleSend = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    try {
      await onSyncRequest(email.trim());
      setSent(true);
    } catch {
      setError('Could not send link. Try again.');
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm"
      style={{
        background: 'linear-gradient(90deg, rgba(13,148,136,0.08), rgba(139,92,246,0.06))',
        borderBottom: '1px solid rgba(13,148,136,0.15)',
      }}
    >
      <Cloud size={14} style={{ color: '#0d9488', shrink: 0 }} />

      {sent ? (
        <span className="flex items-center gap-2 text-xs" style={{ color: '#22c55e' }}>
          <CheckCircle size={13} /> Check your inbox for the sign-in link.
        </span>
      ) : (
        <>
          <span className="text-xs shrink-0" style={{ color: 'var(--text-3)' }}>
            Sign in to sync across devices:
          </span>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs rounded-lg px-3 py-1.5 min-w-0"
            style={{
              background: 'var(--surface)',
              border: `1px solid ${error ? '#ef4444' : 'rgba(13,148,136,0.25)'}`,
              color: 'var(--text-1)',
              outline: 'none',
              width: 180,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#0d9488')}
            onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(13,148,136,0.25)')}
          />
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-all"
            style={{ background: '#0d9488', color: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Send size={11} /> Send link
          </button>
          {error && <span className="text-xs shrink-0" style={{ color: '#ef4444' }}>{error}</span>}
        </>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="ml-auto shrink-0 transition-all"
        style={{ color: 'var(--text-5)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-5)')}
      >
        <X size={13} />
      </button>
    </div>
  );
}
