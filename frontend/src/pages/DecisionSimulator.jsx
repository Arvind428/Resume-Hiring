import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Scale, Play, Info } from 'lucide-react';
import { getCandidates, createSimulation } from '../lib/api';
import { scoreColor } from '../lib/utils';

const STAKEHOLDERS = [
  { key: 'tech_lead', label: 'Tech Lead', color: '#6366F1', weight: 40, focus: 'Technical depth, system design, code quality' },
  { key: 'hr_director', label: 'HR Director', color: '#10B981', weight: 35, focus: 'Culture fit, communication, growth mindset' },
  { key: 'ceo', label: 'CEO', color: '#F59E0B', weight: 25, focus: 'Strategic thinking, leadership potential, vision alignment' },
];

export default function DecisionSimulator() {
  const [candidates, setCandidates] = useState([]);
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(searchParams.get('candidateId') || '');
  const [sessionId] = useState(searchParams.get('sessionId') || '');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCandidates().then(r => setCandidates(r.data)).catch(() => {});
  }, []);

  const selected = candidates.find(c => c.id === selectedId);

  const handleStart = async () => {
    if (!selectedId) return;
    setCreating(true);
    try {
      const res = await createSimulation({ candidateId: selectedId, interviewSessionId: sessionId || undefined });
      navigate(`/simulator/${res.data.simulation.id}`);
    } finally { setCreating(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-module-3)', marginBottom: 6 }}>MODULE 3</div>
        <h1 className="page-title">Hiring Decision Simulator</h1>
        <p className="page-subtitle">Multi-stakeholder simulation with AI conflict mediation</p>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Setup Panel */}
        <div className="card" style={{ borderTop: '3px solid var(--color-module-3)' }}>
          <h3 style={{ marginBottom: 20 }}><Scale size={18} color="var(--color-module-3)" /> Simulation Setup</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Select Candidate *</label>
              <select className="select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                <option value="">Choose a candidate...</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name} — Score: {c.total_score || 'unscored'}</option>)}
              </select>
            </div>
            {sessionId && <div className="alert alert-info" style={{ fontSize: 13 }}>✓ Linked to interview session</div>}
            <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={!selectedId || creating}>
              <Play size={18} /> {creating ? 'Creating...' : 'Launch Simulation'}
            </button>
          </div>
        </div>

        {/* Stakeholder Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STAKEHOLDERS.map(s => (
            <div key={s.key} className="card" style={{ borderLeft: `3px solid ${s.color}`, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.label}</div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: s.color }}>{s.weight}% weight</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.focus}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Simulation Flow</h3>
        <div className="grid-4">
          {[
            { step: '1', title: 'Three Stakeholders', desc: 'Tech Lead, HR Director, and CEO each score the candidate on 5 dimensions' },
            { step: '2', title: 'Conflict Detection', desc: 'System detects axes where stakeholders diverge by 3+ points out of 10' },
            { step: '3', title: 'AI Mediation', desc: 'Claude analyzes the conflict and generates a fair consensus recommendation' },
            { step: '4', title: 'Weighted Verdict', desc: 'Final HIRE / HOLD / REJECT with complete reasoning and weighted score' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-module-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0A0B14', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
