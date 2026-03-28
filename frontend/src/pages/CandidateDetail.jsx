import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, Github, Globe, Zap, MessageSquare, Scale } from 'lucide-react';
import { getCandidate, analyzeCandidate } from '../lib/api';
import { scoreColor, dimensionLabel, formatDate } from '../lib/utils';

const SCORE_DIMS = ['score_technical', 'score_communication', 'score_creativity', 'score_culture_fit', 'score_growth'];

export default function CandidateDetail() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [estimated, setEstimated] = useState(false);

  const load = () => {
    setLoading(true);
    getCandidate(id).then(r => setCandidate(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeCandidate(id);
      setCandidate(res.data);
      setEstimated(res.data.estimated);
    } finally { setAnalyzing(false); }
  };

  if (loading) return <div className="page-container"><div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div></div>;
  if (!candidate) return <div className="page-container"><div style={{ padding: 48, textAlign: 'center', color: 'var(--color-danger)' }}>Candidate not found</div></div>;

  const radarData = SCORE_DIMS.map(dim => ({
    subject: dimensionLabel(dim).replace(' ', '\n'),
    value: candidate[dim] || 0,
    fullMark: 100
  }));

  return (
    <div className="page-container">
      <Link to="/talent" className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }}><ArrowLeft size={14} /> Back</Link>

      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-module-1), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white' }}>
              {candidate.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ marginBottom: 4 }}>{candidate.name}</h2>
              <span className="tag">{candidate.role}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <div style={{ color: 'var(--color-text-muted)' }}>{candidate.email}</div>
            {candidate.github_url && <a href={candidate.github_url} target="_blank" rel="noopener" className="flex flex-center gap-8" style={{ color: 'var(--color-info)' }}><Github size={14} /> {candidate.github_url}</a>}
            {candidate.portfolio_url && <a href={candidate.portfolio_url} target="_blank" rel="noopener" className="flex flex-center gap-8" style={{ color: 'var(--color-info)' }}><Globe size={14} /> {candidate.portfolio_url}</a>}
            {(candidate.skills || []).length > 0 && (
              <div className="tags-wrapper" style={{ marginTop: 4 }}>
                {candidate.skills.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--color-text-dim)', marginTop: 4 }}>Added {formatDate(candidate.created_at)}</div>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={handleAnalyze} disabled={analyzing}>
              <Zap size={13} /> {analyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
            <Link to={`/interview?candidateId=${id}`} className="btn btn-secondary btn-sm"><MessageSquare size={13} /> Interview</Link>
            <Link to={`/simulator?candidateId=${id}`} className="btn btn-secondary btn-sm"><Scale size={13} /> Simulate</Link>
          </div>
          {estimated && <div className="alert alert-warning" style={{ marginTop: 12, fontSize: 13 }}>⚠️ GitHub unavailable — scores estimated from profile data</div>}
        </div>

        {/* Total Score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Signal Score</div>
          <div style={{ fontSize: '5rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(candidate.total_score || 0), lineHeight: 1 }}>
            {candidate.total_score || 0}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>out of 100</div>
          {candidate.total_score >= 70 && <span className="badge badge-hire">Strong Candidate</span>}
          {candidate.total_score >= 50 && candidate.total_score < 70 && <span className="badge badge-maybe">Average</span>}
          {candidate.total_score < 50 && candidate.total_score > 0 && <span className="badge badge-reject">Below Threshold</span>}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Score Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Signal Breakdown</h3>
          <div className="score-bar-wrapper">
            {SCORE_DIMS.map(dim => (
              <div key={dim} className="score-bar-item">
                <span className="score-bar-label">{dimensionLabel(dim)}</span>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${candidate[dim] || 0}%`, background: scoreColor(candidate[dim] || 0) }} />
                </div>
                <span className="score-bar-value" style={{ color: scoreColor(candidate[dim] || 0) }}>{candidate[dim] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Radar View</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Radar name="Score" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} dot={{ fill: '#6366F1', r: 4 }} />
              <Tooltip contentStyle={{ background: '#12131F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Rubric Insights */}
        {(candidate.analysis_strengths || candidate.analysis_weaknesses) && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>AI Rubric Insights</h3>
            <div className="grid-3" style={{ gap: 16 }}>
              <div className="card card-elevated" style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                <h4 style={{ color: 'var(--color-success)', marginBottom: 12 }}>Key Strengths</h4>
                <ul style={{ paddingLeft: 16, color: 'var(--color-text)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(candidate.analysis_strengths || []).map((s,i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="card card-elevated" style={{ background: 'rgba(234, 179, 8, 0.05)' }}>
                <h4 style={{ color: 'var(--color-warning)', marginBottom: 12 }}>Identified Weaknesses</h4>
                <ul style={{ paddingLeft: 16, color: 'var(--color-text)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(candidate.analysis_weaknesses || []).map((s,i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="card card-elevated" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <h4 style={{ color: 'var(--color-danger)', marginBottom: 12 }}>Missing Requirements</h4>
                <ul style={{ paddingLeft: 16, color: 'var(--color-text)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(candidate.analysis_missing || []).map((s,i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* AI Interview Generation */}
        {candidate.interview_questions && candidate.interview_questions.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>AI-Generated Interview Protocol</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {candidate.interview_questions.map((q, i) => (
                <div key={i} className="card card-elevated" style={{ padding: '16px 20px', borderLeft: `4px solid ${q.type === 'technical' ? 'var(--color-primary)' : 'var(--color-warning)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="tag" style={{ background: q.type === 'technical' ? 'var(--color-primary-glow)' : 'rgba(234, 179, 8, 0.1)', color: q.type === 'technical' ? 'var(--color-primary)' : '#c2410c' }}>
                      {(q.type || 'General').toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>QUESTION {i + 1}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: 'var(--color-text)' }}>{q.question}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
