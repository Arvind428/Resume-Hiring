import { Router } from 'express';
import supabase from '../services/supabaseClient.js';
import { fetchGithubData } from '../services/githubService.js';
import { computeSignalScores, estimateScores } from '../services/signalScoring.js';

const router = Router();

// POST /api/candidates — create candidate
router.post('/', async (req, res, next) => {
  try {
    const { name, email, role, github_url, portfolio_url, skills } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'name, email, role are required' });

    const { data, error } = await supabase
      .from('candidates')
      .insert([{ name, email, role, github_url, portfolio_url, skills: skills || [] }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Candidate with this email already exists' });
      throw error;
    }
    res.status(201).json(data);
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
    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !candidate) return res.status(404).json({ error: 'Candidate not found' });

    let githubData = null;
    let estimated = false;

    if (candidate.github_url) {
      githubData = await fetchGithubData(candidate.github_url);
      if (!githubData) estimated = true;
    }

    const scores = githubData
      ? computeSignalScores({ githubData, candidate })
      : estimateScores(candidate);

    const updatePayload = {
      ...scores,
      github_data: githubData,
    };

    const { data: updated, error: updateErr } = await supabase
      .from('candidates')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    res.json({ ...updated, estimated });
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
