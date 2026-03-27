import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Zap, Trash2, ExternalLink, Users } from 'lucide-react';
import { getCandidates, createCandidate, analyzeCandidate, deleteCandidate } from '../lib/api';
import { scoreColor, formatDate } from '../lib/utils';

const ROLES = ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'DevOps Engineer', 'Marketing Manager', 'Sales', 'Other'];

function ScoreBar({ value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: scoreColor(value), borderRadius: 9999, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(value), minWidth: 30, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function TalentDiscovery() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [analyzing, setAnalyzing] = useState({});
  const [form, setForm] = useState({ name: '', email: '', role: '', github_url: '', portfolio_url: '', linkedin_url: '', skills: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getCandidates({ sort: 'score' }).then(r => setCandidates(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.email.trim()) e.email = 'Email required';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.role) e.role = 'Role required';
    if (form.github_url && !/github\.com\/[a-zA-Z0-9_-]+/.test(form.github_url)) e.github_url = 'Must be a valid GitHub URL';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await createCandidate({ ...form, skills });
      await analyzeCandidate(res.data.id);
      setShowModal(false);
      setForm({ name: '', email: '', role: '', github_url: '', portfolio_url: '', linkedin_url: '', skills: '' });
      load();
    } catch (err) {
      if (err.response?.status === 409) setErrors({ email: 'This email already exists' });
    } finally { setSubmitting(false); }
  };

  const handleLoadDemo = async () => {
    if (!confirm('Load 3 demo candidates for the hackathon?')) return;
    setLoading(true);
    const demos = [
      { name: "Dan Abramov", email: "dan@react.dev", role: "Software Engineer", github_url: "https://github.com/gaearon", portfolio_url: "https://overreacted.io", linkedin_url: "https://linkedin.com/in/danabramov", skills: ["React", "JavaScript", "Redux"] },
      { name: "Mona Lisa", email: "mona@github.com", role: "DevOps Engineer", github_url: "https://github.com/octocat", portfolio_url: "https://octodex.github.com", linkedin_url: "", skills: ["Ruby", "Git", "Infrastructure"] },
      { name: "Alice Smith", email: "alice@marketing.com", role: "Marketing Manager", github_url: "", portfolio_url: "https://alicesmith.com", linkedin_url: "https://linkedin.com/in/alicesmith", skills: ["SEO", "Content Strategy", "Analytics"] }
    ];
    try {
      for (const d of demos) {
        try {
          const res = await createCandidate(d);
          await analyzeCandidate(res.data.id);
        } catch (innerErr) {
          if (innerErr.response?.status === 409) {
            console.warn(`Demo candidate ${d.name} already exists! Skipping.`);
          } else {
            console.error(`Failed to load demo ${d.name}`, innerErr);
          }
        }
      }
    } finally { 
      load();
      setLoading(false);
    }
  };

  const handleAnalyze = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    setAnalyzing(prev => ({ ...prev, [id]: true }));
    try { await analyzeCandidate(id); load(); } finally { setAnalyzing(prev => ({ ...prev, [id]: false })); }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this candidate?')) return;
    await deleteCandidate(id); load();
  };

  const filtered = candidates.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="page-header flex flex-between flex-center">
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-module-1)', marginBottom: 6 }}>MODULE 1</div>
          <h1 className="page-title">Talent Discovery Engine</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleLoadDemo} disabled={loading}><Zap size={16} /> Demo Mode</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Candidate</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Candidates', value: candidates.length, color: 'var(--color-module-1)' },
          { label: 'Avg Total Score', value: candidates.length ? Math.round(candidates.reduce((s, c) => s + (c.total_score || 0), 0) / candidates.length) : 0, color: 'var(--color-success)' },
          { label: 'Score ≥ 70', value: candidates.filter(c => c.total_score >= 70).length, color: 'var(--color-info)' },
          { label: 'Analyzed', value: candidates.filter(c => c.total_score > 0).length, color: 'var(--color-warning)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
        <input className="input" style={{ paddingLeft: 38 }} placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users /></div>
            <div className="empty-state-title">No candidates yet</div>
            <div className="empty-state-subtitle">Add your first candidate to start scoring</div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add Candidate</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th style={{ minWidth: 140 }}>Total Score</th>
                  <th>Technical</th>
                  <th>Communication</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/talent/${c.id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-module-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {c.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag">{c.role}</span></td>
                    <td><ScoreBar value={c.total_score || 0} /></td>
                    <td><span style={{ fontWeight: 700, color: scoreColor(c.score_technical || 0), fontFamily: 'JetBrains Mono' }}>{c.score_technical || 0}</span></td>
                    <td><span style={{ fontWeight: 700, color: scoreColor(c.score_communication || 0), fontFamily: 'JetBrains Mono' }}>{c.score_communication || 0}</span></td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{formatDate(c.created_at)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={e => handleAnalyze(c.id, e)} disabled={analyzing[c.id]}>
                          <Zap size={13} /> {analyzing[c.id] ? 'Analyzing...' : 'Re-score'}
                        </button>
                        <Link to={`/talent/${c.id}`} className="btn btn-secondary btn-sm" onClick={e => e.stopPropagation()}><ExternalLink size={13} /></Link>
                        <button className="btn btn-danger btn-sm" onClick={e => handleDelete(c.id, e)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Candidate Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Candidate</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Smith" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="">Select role...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.role && <span className="form-error">{errors.role}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="input" value={form.github_url} onChange={e => setForm({...form, github_url: e.target.value})} placeholder="https://github.com/username" />
                {errors.github_url && <span className="form-error">{errors.github_url}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio URL</label>
                <input className="input" value={form.portfolio_url} onChange={e => setForm({...form, portfolio_url: e.target.value})} placeholder="https://yourportfolio.com" />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="input" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/username" />
              </div>
              <div className="form-group">
                <label className="form-label">Skills (comma-separated)</label>
                <input className="input" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="React, Node.js, AWS, Python..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  <Zap size={15} /> {submitting ? 'Adding & Scoring...' : 'Add & Auto-Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
