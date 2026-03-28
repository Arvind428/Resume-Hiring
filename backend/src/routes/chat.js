import { Router } from 'express';
import supabase from '../services/supabaseClient.js';
import { API_URL, MODEL } from '../services/aiService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { messages } = req.body;
    
    const { data: candidates } = await supabase.from('candidates').select('*');
    
    let dbContext = 'CANDIDATE DATABASE INVENTORY:\n';
    if (!candidates || candidates.length === 0) {
      dbContext += 'The database is currently absolutely empty. You have no candidates.\n';
    } else {
      candidates.forEach(c => {
        dbContext += `\n[ID: ${c.id}] ${c.name} (${c.role})\n`;
        dbContext += `- Final Score: ${c.total_score}/100 | Skills: ${c.skills_score} | Experience: ${c.experience_score} | Projects: ${c.project_score}\n`;
        if (c.skills?.length) dbContext += `- Raw Skills: ${c.skills.join(', ')}\n`;
        if (c.analysis_strengths?.length) dbContext += `- AI Strengths: ${c.analysis_strengths.join(', ')}\n`;
        if (c.analysis_weaknesses?.length) dbContext += `- AI Weaknesses: ${c.analysis_weaknesses.join(', ')}\n`;
      });
    }

    const systemPrompt = `You are an elite AI Hiring Assistant overlaying a custom HR Dashboard.
You have absolute mastery over the Candidate Database. Use the massive context block below to answer the user's questions definitively.
Compare candidates if asked. Identify the best candidate if asked. If the database is empty, inform the user they must add candidates first.

${dbContext}

Answer the user directly, concisely, and professionally. Do not output JSON. Output highly legible, human conversational text.`;

    const mappedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
    ];

    const apiKey = process.env.FEATHERLESS_API_KEY || 'rc_952fa543ebf37f2cf8fe8d7afb15cdec2d227f9eab2ea5d96d43cb024cb9a791';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: mappedMessages
      })
    });

    if (!response.ok) {
        throw new Error('Featherless API Error: ' + response.status);
    }
    const data = await response.json();
    
    res.json({ content: data.choices[0].message.content });
  } catch (err) {
    next(err);
  }
});

export default router;
