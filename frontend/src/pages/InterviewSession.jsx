import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Send, CheckCircle, Mic, MicOff } from 'lucide-react';
import { getInterview, respondInterview } from '../lib/api';
import { scoreColor, dimensionLabel } from '../lib/utils';

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aggregateScores, setAggregateScores] = useState(null);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getInterview(id).then(r => {
      const s = r.data;
      setSession(s);
      const questions = s.questions || [];
      const pending = questions.find(q => q.answer === null);
      if (pending) {
        setCurrentQuestion(pending.question);
        setQuestionNumber(questions.indexOf(pending) + 1);
      }
      if (s.status === 'complete') navigate(`/interview/${id}/summary`);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [session, aiTyping]);

  useEffect(() => {
    return () => { if (window.currentRecognition) window.currentRecognition.stop(); };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (window.currentRecognition) window.currentRecognition.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setError('Speech Recognition not supported in this browser.');
    
    setError('');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setAnswer(prev => (prev + (prev.endsWith(' ') ? '' : ' ') + transcript).trim() + ' ');
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    
    window.currentRecognition = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleSubmit = async () => {
    if (answer.trim().length < 20) { setError('Answer must be at least 20 characters'); return; }
    setError('');
    setSubmitting(true);
    setAiTyping(true);
    try {
      const res = await respondInterview(id, { answer });
      const data = res.data;
      setSession(data.session);
      setAggregateScores(data.aggregateScores);
      setAnswer('');
      if (data.isComplete) {
        setTimeout(() => navigate(`/interview/${id}/summary`), 1200);
      } else {
        setCurrentQuestion(data.nextQuestion);
        setQuestionNumber(data.questionNumber);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Submission failed. Please retry.');
    } finally {
      setSubmitting(false);
      setAiTyping(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>Loading session...</div>;

  const completedQs = (session?.questions || []).filter(q => q.answer);
  const total = 5;
  const progress = ((completedQs.length) / total) * 100;

  const scoreData = aggregateScores ? [
    { name: 'Depth', value: aggregateScores.depth * 10 },
    { name: 'Clarity', value: aggregateScores.clarity * 10 },
    { name: 'Creativity', value: aggregateScores.creativity * 10 },
    { name: 'Honesty', value: aggregateScores.honesty * 10 },
  ] : [];

  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Main Chat Area */}
        <div>
          {/* Progress */}
          <div className="card" style={{ marginBottom: 16, padding: '14px 20px', borderTop: '3px solid var(--color-module-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: 'var(--color-text-muted)' }}>
              <span style={{ fontWeight: 600 }}>Adaptive Interview — {session?.candidates?.name || 'Candidate'}</span>
              <span>{completedQs.length}/{total} Questions</span>
            </div>
            <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-module-2)', borderRadius: 9999, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Chat Messages */}
          <div className="card chat-messages" style={{ minHeight: 320, marginBottom: 16 }}>
            {completedQs.map((qa, i) => (
              <div key={i}>
                <div style={{ marginBottom: 4 }}>
                  <div className="chat-label" style={{ paddingLeft: 4 }}>AI Interviewer</div>
                  <div className="chat-bubble chat-bubble-ai">{qa.question}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div className="chat-label" style={{ paddingRight: 4 }}>You</div>
                  <div className="chat-bubble chat-bubble-user">{qa.answer}</div>
                </div>
                {qa.scores && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingLeft: 4 }}>
                    {Object.entries(qa.scores).filter(([k]) => k !== 'feedback').map(([k, v]) => (
                      <span key={k} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--color-surface-2)', color: scoreColor(v, 10), border: '1px solid var(--color-border)' }}>
                        {k}: {v}/10
                      </span>
                    ))}
                    {qa.scores.feedback && <span style={{ fontSize: 11, color: 'var(--color-text-dim)', fontStyle: 'italic', paddingLeft: 4 }}>{qa.scores.feedback}</span>}
                  </div>
                )}
              </div>
            ))}

            {/* Current question */}
            {currentQuestion && !submitting && (
              <div>
                <div className="chat-label" style={{ paddingLeft: 4 }}>AI Interviewer — Q{questionNumber}</div>
                <div className="chat-bubble chat-bubble-ai">{currentQuestion}</div>
              </div>
            )}

            {aiTyping && (
              <div>
                <div className="chat-label" style={{ paddingLeft: 4 }}>AI Interviewer</div>
                <div className="chat-bubble chat-bubble-ai">
                  <div className="typing-indicator">
                    <div className="typing-dot" /> <div className="typing-dot" /> <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Answer Input */}
          <div className="card">
            <textarea
              className="textarea"
              style={{ minHeight: 100, marginBottom: 10 }}
              placeholder={`Answer Q${questionNumber}... (min 20 characters)`}
              value={answer}
              onChange={e => { setAnswer(e.target.value); setError(''); }}
              disabled={submitting}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
            />
            {error && <div className="form-error" style={{ marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: answer.length < 20 ? 'var(--color-danger)' : 'var(--color-text-dim)' }}>
                {answer.length} chars {answer.length < 20 && `(${20 - answer.length} more)`}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`} onClick={toggleRecording} disabled={submitting}>
                  {isRecording ? <MicOff size={15}/> : <Mic size={15}/>} 
                  {isRecording ? 'Stop Recording' : 'Speak Answer'}
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || answer.length < 20}>
                  {submitting ? 'Analyzing...' : <><Send size={15} /> Submit Answer</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Score Panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card" style={{ borderTop: '3px solid var(--color-module-2)' }}>
            <h4 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 700 }}>Live Score Panel</h4>
            {scoreData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-dim)', fontSize: 13 }}>Submit your first answer to see scores</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={scoreData} barSize={24}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Bar dataKey="value" radius={[4,4,0,0]}>
                      {scoreData.map((d, i) => <Cell key={i} fill={scoreColor(d.value)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {scoreData.map(d => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{d.name}</span>
                      <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: scoreColor(d.value) }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--color-text)' }}>Ctrl+Enter</strong> to submit<br />
              Featherless AI adapts each question based on your answers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
