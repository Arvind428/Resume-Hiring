import { Router } from 'express';
import supabase from '../services/supabaseClient.js';
import { generateInterviewQuestion, scoreInterviewAnswer, generateSessionSummary } from '../services/aiService.js';

const router = Router();
const MAX_QUESTIONS = 5;

// POST /api/interviews/start
router.post('/start', async (req, res, next) => {
  try {
    const { candidateId, roleType, difficulty } = req.body;
    if (!candidateId || !roleType) return res.status(400).json({ error: 'candidateId and roleType required' });

    const { data: candidate, error: cErr } = await supabase
      .from('candidates').select('*').eq('id', candidateId).single();
    if (cErr || !candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Generate first question
    const { question } = await generateInterviewQuestion({
      candidateProfile: candidate,
      previousQA: [],
      questionNumber: 1,
      roleType
    });

    const { data: session, error: sErr } = await supabase
      .from('interview_sessions')
      .insert([{
        candidate_id: candidateId,
        role_type: roleType,
        difficulty: difficulty || 'medium',
        status: 'active',
        questions: [{ question, answer: null, scores: null }]
      }])
      .select().single();

    if (sErr) throw sErr;
    res.status(201).json({ session, currentQuestion: question, questionNumber: 1 });
  } catch (err) { next(err); }
});

// POST /api/interviews/:id/respond
router.post('/:id/respond', async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer || answer.trim().length < 20) {
      return res.status(400).json({ error: 'Answer must be at least 20 characters' });
    }

    const { data: session, error } = await supabase
      .from('interview_sessions').select('*').eq('id', req.params.id).single();
    if (error || !session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'complete') return res.status(400).json({ error: 'Session already complete' });

    const questions = session.questions || [];
    const currentIdx = questions.findIndex(q => q.answer === null);
    if (currentIdx === -1) return res.status(400).json({ error: 'No pending question' });

    // Score the answer
    const scores = await scoreInterviewAnswer({
      question: questions[currentIdx].question,
      answer: answer.trim(),
      questionNumber: currentIdx + 1
    });

    questions[currentIdx].answer = answer.trim();
    questions[currentIdx].scores = scores;

    const questionNumber = questions.length + 1;
    let nextQuestion = null;
    let isComplete = false;

    if (questions.length < MAX_QUESTIONS) {
      const { data: candidate } = await supabase
        .from('candidates').select('*').eq('id', session.candidate_id).single();

      const completedQA = questions.map(q => ({ question: q.question, answer: q.answer }));
      const { question: nextQ } = await generateInterviewQuestion({
        candidateProfile: candidate,
        previousQA: completedQA,
        questionNumber,
        roleType: session.role_type
      });

      nextQuestion = nextQ;
      questions.push({ question: nextQ, answer: null, scores: null });
    } else {
      isComplete = true;
    }

    // Compute aggregate scores
    const completedQs = questions.filter(q => q.answer && q.scores);
    const aggregateScores = {
      depth: Math.round(completedQs.reduce((s, q) => s + (q.scores?.depth || 0), 0) / Math.max(completedQs.length, 1)),
      clarity: Math.round(completedQs.reduce((s, q) => s + (q.scores?.clarity || 0), 0) / Math.max(completedQs.length, 1)),
      creativity: Math.round(completedQs.reduce((s, q) => s + (q.scores?.creativity || 0), 0) / Math.max(completedQs.length, 1)),
      honesty: Math.round(completedQs.reduce((s, q) => s + (q.scores?.honesty || 0), 0) / Math.max(completedQs.length, 1)),
    };

    const updatePayload = { questions, scores: aggregateScores };
    if (isComplete) updatePayload.status = 'complete';

    let summary = null;
    if (isComplete) {
      const { data: candidate } = await supabase
        .from('candidates').select('*').eq('id', session.candidate_id).single();
      summary = await generateSessionSummary({
        candidateProfile: candidate,
        questionsAndAnswers: questions.filter(q => q.answer),
        aggregateScores
      });
      updatePayload.summary = summary.summary;
      updatePayload.recommendation = summary.recommendation;
    }

    const { data: updated, error: uErr } = await supabase
      .from('interview_sessions').update(updatePayload).eq('id', req.params.id).select().single();
    if (uErr) throw uErr;

    res.json({
      session: updated,
      scores,
      aggregateScores,
      nextQuestion,
      questionNumber: isComplete ? null : questionNumber,
      isComplete,
      summary: isComplete ? summary : null
    });
  } catch (err) { next(err); }
});

// GET /api/interviews/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('interview_sessions').select('*, candidates(*)').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Session not found' });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/interviews/:id/summary
router.get('/:id/summary', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('interview_sessions').select('*, candidates(*)').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Session not found' });
    if (data.status !== 'complete') return res.status(400).json({ error: 'Session not yet complete' });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/interviews — list sessions optionally filtered by candidate
router.get('/', async (req, res, next) => {
  try {
    const { candidateId } = req.query;
    let query = supabase.from('interview_sessions').select('*, candidates(name, role)').order('created_at', { ascending: false });
    if (candidateId) query = query.eq('candidate_id', candidateId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
