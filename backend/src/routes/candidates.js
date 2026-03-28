import { Router } from 'express';
import supabase from '../services/supabaseClient.js';
import { fetchGithubData } from '../services/githubService.js';
import { computeSignalScores, estimateScores } from '../services/signalScoring.js';
import multer from 'multer';
import { parseResumeText } from '../services/aiService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/candidates — create candidate
router.post('/', async (req, res, next) => {
  try {
    const { name, email, role, github_url, portfolio_url, linkedin_url, skills } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'name, email, role are required' });

    const { data, error } = await supabase
      .from('candidates')
      .insert([{ name, email, role, github_url, portfolio_url, linkedin_url, skills: skills || [] }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Candidate with this email already exists' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// POST /api/candidates/upload — parse PDF resume without saving immediately to database
router.post('/upload', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
    
    // Dynamic import to bypass Node ESM bugs with pdf-parse
    const pdfModule = await import('pdf-parse');
    const pdfParse = pdfModule.default || pdfModule;
    const pdfData = await pdfParse(req.file.buffer);
    
    // Feature 2: Strict AI JSON Extraction
    const parsed = await parseResumeText(pdfData.text);
    res.json({ extractedData: parsed });
  } catch (err) { next(err); }
});

// GET /api/candidates — list all
router.get('/', async (req, res, next) => {
  try {
    const { role, sort } = req.query;
    let query = supabase.from('candidates').select('*');
    if (role) query = query.eq('role', role);
    if (sort === 'score') query = query.order('total_score', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/candidates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Candidate not found' });
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/candidates/:id/analyze — run signal scoring
router.post('/:id/analyze', async (req, res, next) => {
  try {
    const { jobDescription, experience, projects } = req.body;
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Deep AI Rubric Parsing (Features 3, 4, 5, 8) + External OSINT (Phase 4)
    const { generateRubricScoring, fetchGithubMatrix } = await import('../services/aiService.js');
    
    // Attempt Zero-Trust verification against actual GitHub footprint
    let githubMatrix = null;
    if (candidate.github_url) githubMatrix = await fetchGithubMatrix(candidate.github_url);

    const analysis = await generateRubricScoring(candidate, experience, projects, jobDescription, githubMatrix);

    const updatePayload = {
      score_technical: analysis.score_technical,
      score_communication: analysis.score_communication,
      score_creativity: analysis.score_creativity,
      score_culture_fit: analysis.score_culture_fit,
      score_growth: analysis.score_growth,
      skills_score: analysis.skills_score,
      experience_score: analysis.experience_score,
      project_score: analysis.project_score,
      analysis_strengths: analysis.strengths,
      analysis_weaknesses: analysis.weaknesses,
      analysis_missing: analysis.missing_skills,
      interview_questions: analysis.interview_questions
    };

    const { data: updated, error: updateErr } = await supabase
      .from('candidates')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/candidates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('candidates').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
