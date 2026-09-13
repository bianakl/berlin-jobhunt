import { useState, useContext } from 'react';
import { Stamp, MapPin, HeartPulse, Landmark, KeyRound, Receipt, GraduationCap, ExternalLink, Check } from 'lucide-react';
import { relocationTopics } from '../data/relocation';
import { LanguageContext, useT } from '../lib/LanguageContext';

const ICONS = { Stamp, MapPin, HeartPulse, Landmark, KeyRound, Receipt, GraduationCap };

export default function Relocation() {
  const t = useT();
  const { lang } = useContext(LanguageContext);
  const [selectedId, setSelectedId] = useState(relocationTopics[0].id);
  const selected = relocationTopics.find((topic) => topic.id === selectedId) || relocationTopics[0];
  const content = selected[lang] || selected.en;
  const SelectedIcon = ICONS[selected.icon] || Stamp;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-8 fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
          {t('relo_title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          {t('relo_subtitle')}
        </p>
      </div>

      {/* Topic picker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-6">
        {relocationTopics.map((topic) => {
          const Icon = ICONS[topic.icon] || Stamp;
          const active = topic.id === selectedId;
          const label = (topic[lang] || topic.en).title;
          return (
            <button
              key={topic.id}
              onClick={() => setSelectedId(topic.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: active ? 'var(--accent-faint)' : 'var(--surface)',
                border: active ? '1px solid var(--accent-muted)' : '1px solid var(--border)',
                color: active ? 'var(--accent)' : 'var(--text-2)',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface)'; }}
            >
              <Icon size={16} className="shrink-0" style={{ color: active ? 'var(--accent)' : 'var(--text-4)' }} />
              <span className="text-xs font-semibold leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected topic */}
      <div className="rounded-2xl p-5 md:p-7" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-1.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-faint)', border: '1px solid var(--accent-muted)' }}
          >
            <SelectedIcon size={17} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
            {content.title}
          </h2>
        </div>
        <p className="text-sm mb-6 md:ml-12" style={{ color: 'var(--text-3)' }}>{content.tagline}</p>

        <div className="flex flex-col gap-6">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-semibold mb-2.5" style={{ color: 'var(--text-2)' }}>
                {section.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <Check size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sources */}
        <div className="mt-7 pt-5" style={{ borderTop: '1px solid var(--border-3)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-4)' }}>
            {t('relo_sources')}
          </h3>
          <div className="flex flex-col gap-1.5">
            {content.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink size={13} className="shrink-0" />
                {source.label}
              </a>
            ))}
          </div>
          <p className="text-[11px] mt-4" style={{ color: 'var(--text-5)' }}>
            {t('relo_disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
