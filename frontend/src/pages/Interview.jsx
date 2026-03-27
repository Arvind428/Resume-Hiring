import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Play, Users } from 'lucide-react';
import { getCandidates, startInterview } from '../lib/api';
import { scoreColor } from '../lib/utils';

const ROLE_TYPES = ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'DevOps Engineer', 'General'];
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', desc: 'Foundational questions' },
  { value: 'medium', label: 'Medium', desc: 'Balanced depth' },
  { value: 'hard', label: 'Hard', desc: 'Advanced probing' },
];

export default function Interview() {
  const [candidates, setCandidates] = useState([]);
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(searchParams.get('candidateId') || '');
  const [roleType, setRoleType] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('medium');
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCandidates().then(r => setCandidates(r.data)).catch(() => {});
  }, []);

  const selected = candidates.find(c => c.id === selectedId);

  const handleStart = async () => {
    if (!selectedId) return;
    setStarting(true);
    try {
      const res = await startInterview({ candidateId: selectedId, roleType, difficulty });
      navigate(`/interview/${res.data.session.id}`);
    } finally { setStarting(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-module-2)', marginBottom: 6 }}>MODULE 2</div>
        <h1 className="page-title">Adaptive Interview Engine</h1>
        <p className="page-subtitle">AI-powered interviews that evolve based on candidate thinking patterns</p>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Config Panel */}
        <div className="card" style={{ borderTop: '3px solid var(--color-module-2)' }}>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={18} color="var(--color-module-2)" /> Interview Setup</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Select Candidate *</label>
              <select className="select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                <option value="">Choose a candidate...</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name} — {c.role} (Score: {c.total_score || 'N/A'})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Interview Role Context</label>
              <select className="select" value={roleType} onChange={e => setRoleType(e.target.value)}>
                {ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {DIFFICULTIES.map(d => (
                  <button key={d.value} onClick={() => setDifficulty(d.value)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8, border: '1px solid',
                    borderColor: difficulty === d.value ? 'var(--color-module-2)' : 'var(--color-border)',
                    background: difficulty === d.value ? 'rgba(6,182,212,0.1)' : 'var(--color-surface-2)',
                    color: difficulty === d.value ? '#22D3EE' : 'var(--color-text-muted)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'center'
                  }}>
                    <div>{d.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={!selectedId || starting}>
              <Play size={18} /> {starting ? 'Starting Interview...' : 'Begin Interview Session'}
            </button>
          </div>
        </div>

        {/* Selected Candidate Preview */}
        {selected ? (
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Candidate Preview</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-module-2), var(--color-info))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white' }}>
                {selected.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selected.name}</div>
                <span className="tag">{selected.role}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="card card-elevated" style={{ flex: 1, textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(selected.total_score || 0) }}>{selected.total_score || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Signal Score</div>
              </div>
              <div className="card card-elevated" style={{ flex: 1, textAlign: 'center', padding: 14 }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(selected.score_technical || 0) }}>{selected.score_technical || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Technical</div>
              </div>
            </div>
            <div className="tags-wrapper">
              {(selected.skills || []).slice(0, 8).map(s => <span key={s} className="tag">{s}</span>)}
            </div>
            <div className="alert alert-info" style={{ marginTop: 16, fontSize: 13 }}>
              Claude will adapt questions based on this profile and your responses
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 300 }}>
            <Users size={40} style={{ opacity: 0.3 }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center' }}>Select a candidate to preview their profile and start an AI interview</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>How the Adaptive Engine Works</h3>
        <div className="grid-4">
          {[
            { step: '1', title: 'Profile Analysis', desc: 'Claude reads the candidate\'s signal scores, skills, and role context' },
            { step: '2', title: 'First Question', desc: 'AI generates an opening question tailored to the candidate\'s background' },
            { step: '3', title: 'Adaptive Loop', desc: 'Each answer shapes the next question — deeper on strengths, probing on gaps' },
            { step: '4', title: 'AI Summary', desc: 'After 5 questions, Claude generates a comprehensive hiring summary and recommendation' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-module-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0A0B14', flexShrink: 0 }}>{s.step}</div>
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
