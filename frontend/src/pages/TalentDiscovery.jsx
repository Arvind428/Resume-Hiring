import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Zap, Trash2, ExternalLink, Users, UploadCloud } from 'lucide-react';
import { getCandidates, createCandidate, analyzeCandidate, deleteCandidate, uploadResume } from '../lib/api';
import { useDropzone } from 'react-dropzone';
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
  const [jobDescription, setJobDescription] = useState('We are seeking an experienced developer with a strong background in React, Node.js, and modern AI architectures.');
  const [analyzing, setAnalyzing] = useState({});
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '', github_url: '', portfolio_url: '', linkedin_url: '', skills: '', experience: '', projects: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await uploadResume(formData);
      const data = res.data.extractedData;
      setForm(prev => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        role: data.role || '',
        github_url: data.github_url || '',
        portfolio_url: data.portfolio_url || '',
        linkedin_url: data.linkedin_url || '',
        skills: data.skills ? data.skills.join(', ') : '',
        experience: data.experience ? JSON.stringify(data.experience) : '',
        projects: data.projects ? JSON.stringify(data.projects) : ''
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1
  });

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
      await analyzeCandidate(res.data.id, { jobDescription, experience: form.experience, projects: form.projects });
      setShowModal(false);
      setForm({ name: '', email: '', role: '', github_url: '', portfolio_url: '', linkedin_url: '', skills: '', experience: '', projects: '' });
      load();
    } catch (err) {
      if (err.response?.status === 409) setErrors({ email: 'This email already exists' });
    } finally { setSubmitting(false); }
  };

  const handleLoadDemo = async () => {
    if (!confirm('Load 3 demo candidates for the hackathon?')) return;
    setLoading(true);
    const demos = [
      { name: "Arvind (The Balanced Pro)", email: `arvind_${Date.now()}@demo.com`, role: "Full Stack Engineer", github_url: "https://github.com/Arvind428", portfolio_url: "", linkedin_url: "https://linkedin.com/in/arvind", skills: ["React", "Node.js", "AI Integration"] },
      { name: "Linus (The Hidden Gem)", email: `linus_${Date.now()}@demo.com`, role: "Systems Architect", github_url: "https://github.com/torvalds", portfolio_url: "", linkedin_url: "", skills: ["C", "Linux", "Kernel", "Git"] },
      { name: "Chad (The Resume Hero)", email: `chad_${Date.now()}@demo.com`, role: "Senior Developer", github_url: "https://github.com/empty-user-123", portfolio_url: "", linkedin_url: "https://linkedin.com/in/ex-google-ceo", skills: ["Management", "Agile", "Synergy"] }
    ];
    try {
      for (const d of demos) {
        try {
          const res = await createCandidate(d);
          await analyzeCandidate(res.data.id, { jobDescription });
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
    try { await analyzeCandidate(id, { jobDescription }); load(); } finally { setAnalyzing(prev => ({ ...prev, [id]: false })); }
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

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>Active Job Description (Matrix Matching)</h3>
        <textarea 
          className="input" 
          style={{ minHeight: 80, fontSize: 13, resize: 'vertical' }}
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste your specific job description requirements here..."
        />
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>This context is fed natively into the AI for 4-axis rubric scoring and missing skill identification.</div>
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
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={uploading}>×</button>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              {...getRootProps()} 
              style={{
                border: `2px dashed ${isDragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 8, padding: '24px', textAlign: 'center', marginBottom: 20, 
                background: isDragActive ? 'var(--color-primary-glow)' : 'transparent',
                cursor: 'pointer', transition: 'all 0.2s ease', opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto'
              }}
            >
              <input {...getInputProps()} />
              <UploadCloud size={28} color="var(--color-primary)" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{uploading ? 'Extracting via AI...' : (isDragActive ? 'Drop resume here...' : 'Drag & Drop Resume (PDF/DOCX)')}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Or click to browse files. The AI will instantly auto-fill the form below.</div>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>— Confirm Details —</div>

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
