import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, CheckCircle, Scale, Users } from 'lucide-react';
import { getInterview } from '../lib/api';
import { scoreColor, verdictBadgeClass, verdictLabel } from '../lib/utils';

export default function InterviewSummary() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterview(id).then(r => setSession(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>Loading summary...</div>;
  if (!session) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-danger)' }}>Session not found</div>;

  const scores = session.scores || {};
  const scoreData = [
    { name: 'Depth', value: (scores.depth || 0) * 10 },
    { name: 'Clarity', value: (scores.clarity || 0) * 10 },
    { name: 'Creativity', value: (scores.creativity || 0) * 10 },
    { name: 'Honesty', value: (scores.honesty || 0) * 10 },
  ];

  return (
    <div className="page-container">
      <Link to="/interview" className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }}><ArrowLeft size={14} /> New Interview</Link>

      {/* Header */}
      <div className="card" style={{ marginBottom: 24, borderTop: '3px solid var(--color-module-2)', textAlign: 'center', padding: '32px 24px' }}>
        <CheckCircle size={40} color="var(--color-success)" style={{ marginBottom: 12 }} />
        <h2 style={{ marginBottom: 8 }}>Interview Complete</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>{session.candidates?.name} — {session.role_type}</p>
        {session.recommendation && (
          <span className={`badge badge-${session.recommendation === 'strong_yes' || session.recommendation === 'hire' ? 'hire' : session.recommendation === 'yes' ? 'strong' : session.recommendation === 'maybe' ? 'maybe' : 'reject'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
            {verdictLabel(session.recommendation)}
          </span>
        )}
      </div>

      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* AI Summary */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>AI Assessment</h3>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>{session.summary || 'Summary not available.'}</p>
        </div>

        {/* Score Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Performance Dimensions</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scoreData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {scoreData.map((d, i) => <Cell key={i} fill={scoreColor(d.value)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {scoreData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', minWidth: 80 }}>{d.name}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: `${d.value}%`, height: '100%', background: scoreColor(d.value), borderRadius: 9999, transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(d.value), fontSize: 13, minWidth: 30 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Q&A Transcript */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Full Transcript</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {(session.questions || []).filter(q => q.answer).map((qa, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-module-2)', marginBottom: 6, letterSpacing: '0.06em' }}>QUESTION {i+1}</div>
              <p style={{ fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>{qa.question}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>{qa.answer}</p>
              {qa.scores && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(qa.scores).filter(([k]) => k !== 'feedback').map(([k, v]) => (
                    <span key={k} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--color-surface-2)', color: scoreColor(v, 10), border: '1px solid var(--color-border)' }}>
                      {k}: {v}/10
                    </span>
                  ))}
                  {qa.scores.feedback && <span style={{ fontSize: 12, color: 'var(--color-text-dim)', fontStyle: 'italic', paddingLeft: 4 }}>{qa.scores.feedback}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to={`/simulator?candidateId=${session.candidate_id}&sessionId=${id}`} className="btn btn-primary"><Scale size={16} /> Run Decision Simulation</Link>
        <Link to="/interview" className="btn btn-secondary"><Users size={16} /> New Interview</Link>
      </div>
    </div>
  );
}
