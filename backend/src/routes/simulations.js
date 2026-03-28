import { Router } from 'express';
import supabase from '../services/supabaseClient.js';
import { mediateHiringDecision } from '../services/aiService.js';

const router = Router();

// POST /api/simulations/debate
router.post('/debate', async (req, res, next) => {
  try {
    const { candidateIds, jobDescription } = req.body;
    if (!candidateIds || candidateIds.length !== 3) return res.status(400).json({ error: 'Exactly 3 candidateIds required.' });

    const { data: candidates, error } = await supabase.from('candidates').select('*').in('id', candidateIds);
    if (error || candidates.length !== 3) return res.status(404).json({ error: 'Failed to fetch all 3 candidates.' });

    const { generateSimulationDebate } = await import('../services/aiService.js');
    const debate = await generateSimulationDebate(candidates, jobDescription);

    res.json({ debate, candidates });
  } catch (err) { next(err); }
});

const STAKEHOLDERS = ['tech_lead', 'hr_director', 'ceo'];
const DIMENSIONS = ['technical_skill', 'communication', 'culture_fit', 'leadership', 'growth_potential'];
const WEIGHTS = { tech_lead: 0.40, hr_director: 0.35, ceo: 0.25 };
const CONFLICT_THRESHOLD = 3; // out of 10

// POST /api/simulations
router.post('/', async (req, res, next) => {
  try {
    const { candidateId, interviewSessionId } = req.body;
    if (!candidateId) return res.status(400).json({ error: 'candidateId required' });

    const { data: candidate, error: cErr } = await supabase
      .from('candidates').select('*').eq('id', candidateId).single();
    if (cErr || !candidate) return res.status(404).json({ error: 'Candidate not found' });

    const { data, error } = await supabase
      .from('simulations')
      .insert([{
        candidate_id: candidateId,
        interview_session_id: interviewSessionId || null,
        stakeholder_scores: {},
        conflicts: [],
      }])
      .select().single();

    if (error) throw error;
    res.status(201).json({ simulation: data, candidate, stakeholders: STAKEHOLDERS, dimensions: DIMENSIONS, weights: WEIGHTS });
  } catch (err) { next(err); }
});

// POST /api/simulations/:id/score — submit stakeholder scores
router.post('/:id/score', async (req, res, next) => {
  try {
    const { stakeholder, scores } = req.body;
    if (!stakeholder || !scores) return res.status(400).json({ error: 'stakeholder and scores required' });
    if (!STAKEHOLDERS.includes(stakeholder)) return res.status(400).json({ error: `stakeholder must be one of: ${STAKEHOLDERS.join(', ')}` });

    // Validate all dimensions scored
    for (const dim of DIMENSIONS) {
      if (scores[dim] === undefined || scores[dim] < 0 || scores[dim] > 10) {
        return res.status(400).json({ error: `Score for '${dim}' must be 0–10` });
      }
    }

    const { data: sim, error } = await supabase
      .from('simulations').select('*').eq('id', req.params.id).single();
    if (error || !sim) return res.status(404).json({ error: 'Simulation not found' });

    const updatedScores = { ...sim.stakeholder_scores, [stakeholder]: scores };

    const { data: updated, error: uErr } = await supabase
      .from('simulations').update({ stakeholder_scores: updatedScores }).eq('id', req.params.id).select().single();
    if (uErr) throw uErr;

    const allScored = STAKEHOLDERS.every(s => updatedScores[s]);
    res.json({ simulation: updated, allScored, remainingStakeholders: STAKEHOLDERS.filter(s => !updatedScores[s]) });
  } catch (err) { next(err); }
});

// POST /api/simulations/:id/decide — run conflict detection + AI mediation + final verdict
router.post('/:id/decide', async (req, res, next) => {
  try {
    const { data: sim, error } = await supabase
      .from('simulations').select('*, candidates(*)').eq('id', req.params.id).single();
    if (error || !sim) return res.status(404).json({ error: 'Simulation not found' });

    const scores = sim.stakeholder_scores;
    if (!STAKEHOLDERS.every(s => scores[s])) {
      return res.status(400).json({ error: 'All stakeholders must submit scores before deciding' });
    }

    // Detect conflicts
    const conflicts = [];
    for (const dim of DIMENSIONS) {
      const vals = STAKEHOLDERS.map(s => scores[s][dim]);
      const max = Math.max(...vals);
      const min = Math.min(...vals);
      if (max - min >= CONFLICT_THRESHOLD) {
        conflicts.push({
          dimension: dim,
          values: STAKEHOLDERS.map(s => ({ role: s, score: scores[s][dim] })),
          spread: max - min
        });
      }
    }

    // Compute weighted aggregate
    const dimensionAggregates = {};
    for (const dim of DIMENSIONS) {
      dimensionAggregates[dim] = STAKEHOLDERS.reduce((sum, s) => sum + scores[s][dim] * WEIGHTS[s], 0);
    }
    const rawAvg = Object.values(dimensionAggregates).reduce((a, b) => a + b, 0) / DIMENSIONS.length;
    const weightedFinalScore = Math.round(rawAvg * 10); // scale to 0–100

    // AI mediation (always run if conflicts, or if close decision)
    const formattedScores = {};
    for (const s of STAKEHOLDERS) formattedScores[s] = scores[s];

    const mediation = await mediateHiringDecision({
      candidateProfile: sim.candidates,
      stakeholderScores: formattedScores,
      conflicts
    });

    const verdict = mediation.recommendation || (weightedFinalScore >= 70 ? 'hire' : weightedFinalScore >= 50 ? 'hold' : 'reject');

    const { data: updated, error: uErr } = await supabase
      .from('simulations').update({
        conflicts,
        mediation_result: mediation.analysis,
        final_score: mediation.final_score || weightedFinalScore,
        verdict,
        reasoning: mediation.reasoning
      }).eq('id', req.params.id).select().single();
    if (uErr) throw uErr;

    res.json({
      simulation: updated,
      conflicts,
      dimensionAggregates,
      mediation,
      verdict,
      finalScore: mediation.final_score || weightedFinalScore
    });
  } catch (err) { next(err); }
});

// GET /api/simulations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('simulations').select('*, candidates(*)').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Simulation not found' });
    res.json(data);
  } catch (err) { next(err); }
});

// GET /api/simulations
router.get('/', async (req, res, next) => {
  try {
    const { candidateId } = req.query;
    let query = supabase.from('simulations').select('*, candidates(name, role)').order('created_at', { ascending: false });
    if (candidateId) query = query.eq('candidate_id', candidateId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
