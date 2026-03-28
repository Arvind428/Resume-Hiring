import { useState, useEffect } from 'react';
import { Scale, Play, CheckCircle, Users } from 'lucide-react';
import { getCandidates, runSimulationDebate } from '../lib/api';

export default function DecisionSimulator() {
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [jobDescription, setJobDescription] = useState('Senior React Node Engineer ready to scale a high velocity SaaS platform');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getCandidates().then(r => setCandidates(r.data)).catch(() => {});
  }, []);

  const toggleCandidate = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDebate = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await runSimulationDebate({ candidateIds: selectedIds, jobDescription });
      setResult(data);
    } catch (err) {
      alert('Debate failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-module-3)', marginBottom: 6 }}>MODULE 3</div>
        <h1 className="page-title">Virtual Committee Simulator</h1>
        <p className="page-subtitle">Select exactly 3 candidates. Kimi K2 AI acts as Tech Lead, HR, and CEO to mathematically debate the absolute best hire based on their raw data.</p>
      </div>

      {!result ? (
        <div className="grid-2" style={{ gap: 24 }}>
          {/* Candidates */}
          <div className="card" style={{ borderTop: '3px solid var(--color-module-3)' }}>
            <h3 style={{ marginBottom: 16 }}><Users size={16} style={{ marginRight: 8 }} /> Roster ({selectedIds.length}/3 Selectd)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidates.map(c => {
                const isSelected = selectedIds.includes(c.id);
                const disabled = !isSelected && selectedIds.length >= 3;
                return (
                  <div key={c.id} onClick={() => !disabled && toggleCandidate(c.id)} style={{ padding: 16, borderRadius: 8, border: `2px solid ${isSelected ? 'var(--color-module-3)' : 'var(--color-border)'}`, background: isSelected ? 'rgba(245, 158, 11, 0.05)' : 'var(--color-surface)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{c.role} • Score: {c.total_score || 0}</div>
                    </div>
                    {isSelected && <CheckCircle color="var(--color-module-3)" size={20} />}
                  </div>
                );
              })}
              {candidates.length === 0 && <div style={{ color: 'var(--color-text-muted)' }}>No candidates in database.</div>}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}><Scale size={16} style={{ marginRight: 8 }} /> Evaluation Context</h3>
            <div className="form-group">
              <label className="form-label">Job Description Target</label>
              <textarea className="input" rows="8" value={jobDescription} onChange={e => setJobDescription(e.target.value)}></textarea>
            </div>
            
            <button className="btn btn-primary btn-lg" onClick={handleDebate} disabled={selectedIds.length !== 3 || running || !jobDescription} style={{ width: '100%', marginTop: 24, background: 'var(--color-module-3)', borderColor: 'var(--color-module-3)' }}>
              <Play size={18} /> {running ? 'Architecting Debate...' : 'Initialize AI Committee Context'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ borderTop: '3px solid var(--color-module-3)' }}>
           <h2 style={{ textAlign: 'center', marginBottom: 12, color: 'var(--color-text)' }}>Debate Finished</h2>
           <div style={{ fontSize: '1.2rem', textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 32 }}>Unanimous Verdict: <span style={{ fontWeight: 700, color: 'var(--color-module-3)' }}>{result.debate.winner_name}</span></div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
             {(result.debate.transcript || []).map((t, idx) => {
               const colors = { 'Tech Lead': '#6366F1', 'HR Director': '#10B981', 'CEO': '#F59E0B' };
               const color = colors[t.speaker] || 'var(--color-primary)';
               return (
                 <div key={idx} style={{ padding: 16, background: 'var(--color-surface)', borderLeft: `4px solid ${color}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color, marginBottom: 6 }}>{t.speaker.toUpperCase()}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)' }}>{t.dialogue}</div>
                 </div>
               );
             })}
           </div>

           <div className="alert alert-info" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <h4 style={{ color: 'var(--color-module-3)', marginBottom: 8 }}>Strategic Verification</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text)' }}>{result.debate.final_verdict}</p>
           </div>
           
           <button className="btn btn-secondary" onClick={() => setResult(null)} style={{ marginTop: 24 }}><ArrowLeft size={16} /> Run Another Debate</button>
        </div>
      )}
    </div>
  );
}
