import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowLeft, Scale, Download } from 'lucide-react';
import { getSimulation, scoreSimulation, decideSimulation } from '../lib/api';
import { scoreColor, dimensionLabel } from '../lib/utils';

const STAKEHOLDERS = [
  { key: 'tech_lead', label: 'Tech Lead', color: '#6366F1', weight: 40 },
  { key: 'hr_director', label: 'HR Director', color: '#10B981', weight: 35 },
  { key: 'ceo', label: 'CEO', color: '#F59E0B', weight: 25 },
];
const DIMENSIONS = ['technical_skill', 'communication', 'culture_fit', 'leadership', 'growth_potential'];

function Slider({ value, onChange, color, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" min={0} max={10} value={value} onChange={e => onChange(Number(e.target.value))} disabled={disabled}
        style={{ flex: 1, accentColor: color, cursor: disabled ? 'not-allowed' : 'pointer' }} />
      <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: 14, color, minWidth: 20, textAlign: 'center' }}>{value}</span>
    </div>
  );
}

export default function SimulationDetail() {
  const { id } = useParams();
  const [sim, setSim] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    tech_lead: { technical_skill: 5, communication: 5, culture_fit: 5, leadership: 5, growth_potential: 5 },
    hr_director: { technical_skill: 5, communication: 5, culture_fit: 5, leadership: 5, growth_potential: 5 },
    ceo: { technical_skill: 5, communication: 5, culture_fit: 5, leadership: 5, growth_potential: 5 },
  });
  const [submitted, setSubmitted] = useState({ tech_lead: false, hr_director: false, ceo: false });
  const [deciding, setDeciding] = useState(false);
  const [result, setResult] = useState(null);
  const [activeStakeholder, setActiveStakeholder] = useState('tech_lead');

  const load = () => {
    setLoading(true);
    getSimulation(id).then(r => {
      setSim(r.data);
      setCandidate(r.data.candidates);
      // pre-fill submitted if DB has data
      const dbScores = r.data.stakeholder_scores || {};
      if (Object.keys(dbScores).length > 0) {
        const newSubmitted = {};
        STAKEHOLDERS.forEach(s => { newSubmitted[s.key] = !!dbScores[s.key]; });
        setSubmitted(newSubmitted);
        if (Object.keys(dbScores).length > 0) {
          setScores(prev => { const s = { ...prev }; Object.entries(dbScores).forEach(([k,v]) => { if(v) s[k] = v; }); return s; });
        }
      }
      if (r.data.verdict) {
        setResult({ verdict: r.data.verdict, finalScore: r.data.final_score, reasoning: r.data.reasoning, mediation: r.data.mediation_result, conflicts: r.data.conflicts });
      }
    }).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const handleSubmitScores = async (stakeholderKey) => {
    try {
      await scoreSimulation(id, { stakeholder: stakeholderKey, scores: scores[stakeholderKey] });
      setSubmitted(prev => ({ ...prev, [stakeholderKey]: true }));
      // move to next
      const idx = STAKEHOLDERS.findIndex(s => s.key === stakeholderKey);
      if (idx < STAKEHOLDERS.length - 1) setActiveStakeholder(STAKEHOLDERS[idx + 1].key);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to submit scores');
    }
  };

  const handleDecide = async () => {
    setDeciding(true);
    try {
      const res = await decideSimulation(id);
      setResult({ verdict: res.data.verdict, finalScore: res.data.finalScore, reasoning: res.data.mediation?.reasoning, mediation: res.data.mediation?.analysis, conflicts: res.data.conflicts, consensus: res.data.mediation?.consensus_points });
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Decision failed');
    } finally { setDeciding(false); }
  };

  const allSubmitted = STAKEHOLDERS.every(s => submitted[s.key]);

  const handleExport = () => {
    const data = { candidate, simulation: sim, scores, result };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `hiring-decision-${candidate?.name || 'candidate'}.json`; a.click();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>Loading simulation...</div>;

  const verdictColors = { hire: 'var(--color-success)', hold: 'var(--color-warning)', reject: 'var(--color-danger)' };

  return (
    <div className="page-container">
      <Link to="/simulator" className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }}><ArrowLeft size={14} /> Back</Link>

      {/* Header */}
      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--color-module-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-module-3)', marginBottom: 4 }}>DECISION SIMULATION</div>
          <h2 style={{ marginBottom: 4 }}>{candidate?.name}</h2>
          <span className="tag">{candidate?.role}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Signal Score</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(candidate?.total_score || 0) }}>{candidate?.total_score || 0}</div>
        </div>
      </div>

      {!result && (
        <>
          {/* Stakeholder Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {STAKEHOLDERS.map(s => (
              <button key={s.key} onClick={() => setActiveStakeholder(s.key)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid',
                borderColor: activeStakeholder === s.key ? s.color : 'var(--color-border)',
                background: activeStakeholder === s.key ? `${s.color}18` : 'var(--color-surface)',
                color: activeStakeholder === s.key ? s.color : 'var(--color-text-muted)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                {submitted[s.key] && <CheckCircle size={14} />}
                {s.label}
                <span style={{ fontSize: 12, opacity: 0.7 }}>{s.weight}%</span>
              </button>
            ))}
          </div>

          {/* Active Stakeholder Scoring */}
          {STAKEHOLDERS.filter(s => s.key === activeStakeholder).map(stakeholder => (
            <div key={stakeholder.key} className="card" style={{ marginBottom: 24, borderLeft: `3px solid ${stakeholder.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ color: stakeholder.color }}>{stakeholder.label} Scoring</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Weight: {stakeholder.weight}% of final decision</p>
                </div>
                {submitted[stakeholder.key] && <span className="badge badge-hire">✓ Submitted</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {DIMENSIONS.map(dim => (
                  <div key={dim}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{dimensionLabel(dim)}</span>
                    </div>
                    <Slider
                      value={scores[stakeholder.key][dim]}
                      onChange={v => setScores(prev => ({ ...prev, [stakeholder.key]: { ...prev[stakeholder.key], [dim]: v } }))}
                      color={stakeholder.color}
                      disabled={submitted[stakeholder.key]}
                    />
                  </div>
                ))}
              </div>
              {!submitted[stakeholder.key] && (
                <button className="btn btn-primary" style={{ marginTop: 20, borderColor: stakeholder.color, background: stakeholder.color }} onClick={() => handleSubmitScores(stakeholder.key)}>
                  Submit {stakeholder.label} Scores
                </button>
              )}
            </div>
          ))}

          {/* Run Decision */}
          {allSubmitted && (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <CheckCircle size={32} color="var(--color-success)" style={{ marginBottom: 12 }} />
              <h3 style={{ marginBottom: 8 }}>All Stakeholders Scored</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 20, fontSize: 14 }}>Claude will now detect conflicts, mediate, and deliver a final weighted verdict.</p>
              <button className="btn btn-primary btn-lg" onClick={handleDecide} disabled={deciding}>
                <Scale size={18} /> {deciding ? 'AI Mediating...' : 'Run Decision Simulation'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Verdict */}
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24, borderTop: `3px solid ${verdictColors[result.verdict] || 'var(--color-primary)'}` }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>FINAL DECISION</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'Sora', color: verdictColors[result.verdict] || 'var(--color-primary)', marginBottom: 8 }}>
              {(result.verdict || '').toUpperCase()}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--color-text-muted)' }}>
              {result.finalScore}<span style={{ fontSize: '1rem' }}>/100</span>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 24,  marginBottom: 24 }}>
            {/* Conflicts */}
            <div className="card">
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                {(result.conflicts || []).length > 0 ? <AlertTriangle size={18} color="var(--color-warning)" /> : <CheckCircle size={18} color="var(--color-success)" />}
                {(result.conflicts || []).length > 0 ? 'Conflicts Detected' : 'No Conflicts'}
              </h3>
              {(result.conflicts || []).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>All stakeholders were aligned on the key dimensions.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(result.conflicts || []).map((c, i) => (
                    <div key={i} className="card card-elevated" style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--color-warning)' }}>{dimensionLabel(c.dimension)}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(c.values || []).map((v, j) => (
                          <span key={j} style={{ fontSize: 12, padding: '2px 10px', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            {v.role?.replace('_', ' ')}: <strong>{v.score}</strong>
                          </span>
                        ))}
                        <span style={{ fontSize: 12, color: 'var(--color-warning)' }}>spread: {c.spread}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Mediation */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>AI Mediation</h3>
              {result.mediation && <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{result.mediation}</p>}
              {result.reasoning && <div className="alert alert-info" style={{ fontSize: 13 }}><strong>Reasoning:</strong> {result.reasoning}</div>}
            </div>
          </div>

          {/* Stakeholder Score Comparison */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Stakeholder Score Comparison</h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Dimension</th>
                    {STAKEHOLDERS.map(s => <th key={s.key} style={{ color: s.color }}>{s.label}</th>)}
                    <th>Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {DIMENSIONS.map(dim => {
                    const vals = STAKEHOLDERS.map(s => scores[s.key]?.[dim] || 0);
                    const spread = Math.max(...vals) - Math.min(...vals);
                    return (
                      <tr key={dim}>
                        <td>{dimensionLabel(dim)}</td>
                        {vals.map((v, i) => (
                          <td key={i} style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(v, 10) }}>{v}/10</td>
                        ))}
                        <td>
                          <span style={{ fontSize: 13, fontWeight: 600, color: spread >= 3 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                            {spread >= 3 ? `⚠️ ${spread}` : `✓ ${spread}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={handleExport}><Download size={15} /> Export Decision</button>
            <Link to="/simulator" className="btn btn-secondary"><Scale size={15} /> New Simulation</Link>
          </div>
        </div>
      )}
    </div>
  );
}
