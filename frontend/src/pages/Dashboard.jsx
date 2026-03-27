import { Link } from 'react-router-dom';
import { Users, MessageSquare, Scale, ArrowRight, Zap, Brain, Target } from 'lucide-react';

const modules = [
  {
    id: 1,
    icon: <Users size={28} />,
    accent: 'var(--color-module-1)',
    accentBg: 'rgba(139,92,246,0.12)',
    label: 'MODULE 1',
    title: 'Talent Discovery Engine',
    description: 'Go beyond resumes. Score candidates across 5 signal dimensions using GitHub activity, portfolio analysis, and skill alignment.',
    features: ['GitHub Activity Analysis', '5-Dimension Signal Scoring', 'Radar Chart Visualization'],
    cta: '/talent',
    ctaLabel: 'Discover Talent',
  },
  {
    id: 2,
    icon: <MessageSquare size={28} />,
    accent: 'var(--color-module-2)',
    accentBg: 'rgba(6,182,212,0.12)',
    label: 'MODULE 2',
    title: 'Adaptive Interview Engine',
    description: 'AI-powered interviews that evolve with each answer. Claude Sonnet analyzes thinking patterns and adapts questions in real-time.',
    features: ['Claude Sonnet AI Questions', 'Adaptive Q&A Flow', 'Real-Time Pattern Scoring'],
    cta: '/interview',
    ctaLabel: 'Start Interview',
  },
  {
    id: 3,
    icon: <Scale size={28} />,
    accent: 'var(--color-module-3)',
    accentBg: 'rgba(245,158,11,0.12)',
    label: 'MODULE 3',
    title: 'Decision Simulator',
    description: 'Simulate multi-stakeholder hiring decisions. Surface conflicts between Tech Lead, HR, and CEO — then let AI mediate.',
    features: ['3-Stakeholder Simulation', 'Conflict Detection', 'AI Consensus Mediation'],
    cta: '/simulator',
    ctaLabel: 'Run Simulation',
  },
];

const stats = [
  { icon: <Zap size={20} />, label: 'Signal Dimensions', value: '5' },
  { icon: <Brain size={20} />, label: 'AI Adaptive Questions', value: '5' },
  { icon: <Target size={20} />, label: 'Stakeholder Weight Axes', value: '3×5' },
];

export default function Dashboard() {
  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 0 40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9999, padding: '6px 16px', marginBottom: 20, fontSize: 13, color: '#A5B4FC', fontWeight: 600 }}>
          <Brain size={14} /> HACKATHON MODE — INTELLIGENT HIRING SYSTEM
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.2, marginBottom: 16, background: 'linear-gradient(135deg, #F1F5F9 0%, #818CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hire Smarter.<br />Beyond the Resume.
        </h1>
        <p style={{ fontSize: 17, color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Three AI-powered modules that transform how you discover talent,
          conduct interviews, and make hiring decisions.
        </p>
        <div className="flex" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--color-primary)' }}>{s.icon}</span>
              <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text)' }}>{s.value}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid-3" style={{ marginTop: 8 }}>
        {modules.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: `3px solid ${m.accent}`, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: m.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.accent, flexShrink: 0 }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: m.accent, marginBottom: 4 }}>{m.label}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>{m.title}</h3>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.65 }}>{m.description}</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {m.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.accent, display: 'inline-block', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={m.cta} className="btn btn-primary" style={{ marginTop: 'auto' }}>
              {m.ctaLabel} <ArrowRight size={15} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
