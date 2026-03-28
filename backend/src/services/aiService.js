export const MODEL = 'moonshotai/Kimi-K2-Instruct';
export const API_URL = 'https://api.featherless.ai/v1/chat/completions';

async function fetchFromFeatherless(systemPrompt, userPrompt, maxTokens = 800) {
  const apiKey = process.env.FEATHERLESS_API_KEY || 'rc_952fa543ebf37f2cf8fe8d7afb15cdec2d227f9eab2ea5d96d43cb024cb9a791';
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Featherless API Error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  try {
    return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (e) {
    console.error('Failed to parse AI Rubric JSON:', content);
    throw new Error('AI failed to parse rubric text.');
  }
}

export async function generateInterviewQuestion({ candidateProfile, previousQA, questionNumber, roleType }) {
  const qaContext = previousQA.length > 0
    ? previousQA.map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`).join('\n\n')
    : 'No previous questions yet.';

  const systemPrompt = `You are a senior hiring interviewer conducting an adaptive interview for a ${roleType} position. 
Analyze the candidate's profile and previous answers to generate probing, insightful questions.
Adapt the depth and direction based on what you've learned so far.
Return ONLY valid JSON with no markdown, no explanation.`;

  const userPrompt = `Candidate Profile:
Name: ${candidateProfile.name}
Role Applied: ${candidateProfile.role}
Skills: ${(candidateProfile.skills || []).join(', ')}
GitHub: ${candidateProfile.github_url || 'N/A'}
Portfolio: ${candidateProfile.portfolio_url || 'N/A'}
Signal Scores - Technical: ${candidateProfile.score_technical}/100, Communication: ${candidateProfile.score_communication}/100

Previous Q&A:
${qaContext}

This is question ${questionNumber} of 5. Generate ONE adaptive, open-ended interview question that probes deeper based on the candidate profile and prior answers.
Return JSON exactly like this: { "question": "..." }`;

  try {
    return await fetchFromFeatherless(systemPrompt, userPrompt, 300);
  } catch(e) {
    console.error("Error in generateInterviewQuestion:", e);
    return { question: "Tell me about a challenging technical problem you solved recently and how you approached it." };
  }
}

export async function scoreInterviewAnswer({ question, answer, questionNumber }) {
  const systemPrompt = `You are an expert interviewer scoring candidate responses objectively.
Score across 4 dimensions on a scale of 0-10.
Return ONLY valid JSON with no markdown, no explanation.`;

  const userPrompt = `Interview Question: ${question}
Candidate Answer: ${answer}

Score the response on:
- depth (0-10): analytical depth and substance
- clarity (0-10): communication clarity and structure  
- creativity (0-10): novel thinking or unique perspective
- honesty (0-10): authentic self-awareness and genuine reflection

Return JSON exactly like this: { "depth": N, "clarity": N, "creativity": N, "honesty": N, "feedback": "One-sentence insight about this answer" }`;

  try {
    return await fetchFromFeatherless(systemPrompt, userPrompt, 400);
  } catch(e) {
    console.error("Error in scoreInterviewAnswer:", e);
    return { depth: 5, clarity: 5, creativity: 5, honesty: 5, feedback: "Response scored." };
  }
}

export async function generateSessionSummary({ candidateProfile, questionsAndAnswers, aggregateScores }) {
  const qaText = questionsAndAnswers.map((qa, i) =>
    `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\nScores: depth=${qa.scores?.depth}, clarity=${qa.scores?.clarity}, creativity=${qa.scores?.creativity}, honesty=${qa.scores?.honesty}`
  ).join('\n\n');

  const systemPrompt = `You are a hiring expert writing a comprehensive interview summary report.
Be specific, cite actual answers, and provide actionable hiring insights.
Return ONLY valid JSON with no markdown, no explanation.`;

  const userPrompt = `Candidate: ${candidateProfile.name} - applying for ${candidateProfile.role}

Full Interview Transcript:
${qaText}

Aggregate Scores: depth=${aggregateScores.depth}/10, clarity=${aggregateScores.clarity}/10, creativity=${aggregateScores.creativity}/10, honesty=${aggregateScores.honesty}/10

Write a hiring summary with:
1. Overall assessment (2-3 sentences)
2. Key strengths observed
3. Areas of concern
4. Final recommendation with justification

Return JSON exactly like this: { 
  "summary": "full narrative text (3-4 paragraphs)",
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "strong_yes|yes|maybe|no",
  "recommendation_reason": "one sentence"
}`;

  try {
    return await fetchFromFeatherless(systemPrompt, userPrompt, 800);
  } catch(e) {
    console.error("Error in generateSessionSummary:", e);
    return {
      summary: "Interview completed. Review individual scores for assessment.",
      strengths: ["Completed all questions"],
      concerns: ["Summary generation failed"],
      recommendation: "maybe",
      recommendation_reason: "Manual review recommended."
    };
  }
}

export async function mediateHiringDecision({ candidateProfile, stakeholderScores, conflicts }) {
  const conflictText = conflicts.length > 0
    ? `Conflicts detected on: ${conflicts.map(c => `${c.dimension} (${c.values.map(v => v.score).join(' vs ')})`).join(', ')}`
    : 'No significant conflicts detected.';

  const scoresText = Object.entries(stakeholderScores).map(([role, scores]) =>
    `${role}: ${Object.entries(scores).map(([k, v]) => `${k}=${v}`).join(', ')}`
  ).join('\n');

  const systemPrompt = `You are a neutral AI mediator facilitating a fair hiring decision.
Analyze stakeholder perspectives, resolve conflicts, and produce a fair consensus.
Return ONLY valid JSON with no markdown, no explanation.`;

  const userPrompt = `Candidate: ${candidateProfile.name} - ${candidateProfile.role}
Total Signal Score: ${candidateProfile.total_score || 0}/100

Stakeholder Scores (0-10 per dimension):
${scoresText}

${conflictText}

Stakeholder weights: Tech Lead 40%, HR Director 35%, CEO 25%

Provide mediation analysis and a final hiring recommendation.
Return JSON exactly like this: {
  "analysis": "2-3 sentences explaining the stakeholder dynamics",
  "consensus_points": ["point1", "point2"],
  "resolution": "how conflicts are resolved",
  "recommendation": "hire|hold|reject",
  "final_score": 85,
  "reasoning": "2-3 sentences of final justification"
}`;

  try {
    return await fetchFromFeatherless(systemPrompt, userPrompt, 600);
  } catch(e) {
    console.error("Error in mediateHiringDecision:", e);
    return {
      analysis: "Stakeholder mediation completed.",
      consensus_points: ["Technical competency evaluated", "Culture fit assessed"],
      resolution: "Weighted average applied.",
      recommendation: "hold",
      final_score: 60,
      reasoning: "Manual review recommended for final decision."
    };
  }
}

export async function parseResumeText(rawText) {
  const systemPrompt = `You are a highly precise HR parser. Extract the vital details from the following unstructured resume text.
Return ONLY valid JSON with no markdown and no conversational text.`;

  const userPrompt = `Resume Text:
${rawText}

Extract the following fields precisely according to the strict hiring rubric:
{
  "name": "Full Name",
  "email": "Email Address",
  "role": "Most relevant Job Title (e.g. Software Engineer)",
  "linkedin_url": "Full LinkedIn URL",
  "github_url": "Full GitHub URL",
  "portfolio_url": "Any personal website",
  "skills": ["Array", "of", "Skills"],
  "experience": ["Array", "of", "Work Experience Roles/Tenures"],
  "projects": ["Array", "of", "Notable Projects"]
}`;

  try {
    return await fetchFromFeatherless(systemPrompt, userPrompt, 1500);
  } catch(e) {
    console.error("Error in parseResumeText:", e);
    throw new Error('AI failed to parse resume text.');
  }
}

export async function fetchGithubMatrix(githubUrl) {
  if (!githubUrl) return null;
  try {
    const username = githubUrl.split('/').filter(Boolean).pop();
    if (!username) return null;
    
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    const userData = await userRes.json();
    if (userData.message === 'Not Found') return null;
    
    const repoRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    const repos = await repoRes.json();
    
    if (!repos || !Array.isArray(repos)) return null;

    const repoDetails = repos.map(r => `${r.name} (${r.language || 'Unknown'}): ${r.description || 'No description'} [Stars: ${r.stargazers_count}]`).join('\n');
    return `GitHub User: ${userData.login} | Public Repos: ${userData.public_repos} | Followers: ${userData.followers}\nRecent Top Repositories:\n${repoDetails}`;
  } catch (err) {
    console.error('GitHub fetch failed:', err);
    return null;
  }
}

export async function generateRubricScoring(candidate, rawExperience, rawProjects, jobDescription, githubMatrix) {
  const systemPrompt = `You are an elite Staffing AI. Execute a comprehensive rubric analysis matching the candidate explicitly against the precise Job Description. Return ONLY valid JSON.`;
  
  const userPrompt = `Job Description Context:
${jobDescription || 'A standard technical engineering role demanding high competency.'}

Candidate Profile Extract:
Role: ${candidate.role}
Skills: ${(candidate.skills||[]).join(', ')}
Experience History: ${rawExperience || 'Not explicitly provided.'}
Project History: ${rawProjects || 'Not explicitly provided.'}
${githubMatrix ? `\nVerified Zero-Trust GitHub OSINT Data:\n${githubMatrix}` : ''}

Your objectives:
1. Assess a direct Match Score (final_score).
2. Segment scores across 3 primary axes (skills_score, experience_score, project_score). If OSINT Data reveals low GitHub output, heavily penalize project_score.
3. Evaluate the 5 core Radar Dimensions from 0-100: score_technical, score_communication, score_creativity, score_culture_fit, score_growth.
4. Identify top Strengths, critical Weaknesses, and Missing Skills relative strictly to the Job Description.
5. Auto-generate 5 adaptive Interview Questions (3 technical/domain-specific, 2 behavioral/cultural).

Return JSON exactly adhering to this strict schema:
{
  "skills_score": 85,
  "experience_score": 70,
  "project_score": 90,
  "final_score": 82,
  "score_technical": 85,
  "score_communication": 90,
  "score_creativity": 80,
  "score_culture_fit": 88,
  "score_growth": 95,
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1"],
  "missing_skills": ["Missing Skill"],
  "interview_questions": [
    { "type": "technical", "question": "..." },
    { "type": "behavioral", "question": "..." }
  ]
}`;

  try {
    return await fetchFromFeatherless(systemPrompt, userPrompt, 2000);
  } catch(e) {
    console.error("Error in generateRubricScoring:", e);
    return {
      skills_score: 50, experience_score: 50, project_score: 50, final_score: 50,
      score_technical: 50, score_communication: 50, score_creativity: 50, score_culture_fit: 50, score_growth: 50,
      strengths: ["Parsing error occurred"], weaknesses: ["Failed to grade"], missing_skills: [],
      interview_questions: []
    };
  }
}

export async function generateSimulationDebate(candidates, jobDescription) {
  const systemPrompt = `You are an expert Virtual Hiring Committee comprised of a strict Tech Lead, an empathetic HR Director, and a strategic CEO. Critically debate the provided candidates against the precise Job Description. Return ONLY valid JSON.`;
  
  const profiles = candidates.map((c, i) => `[Candidate ${c.name}]: Role: ${c.role}, Final Rubric Score: ${c.total_score}. ${c.analysis_strengths ? `Strengths: ${c.analysis_strengths.join(', ')}` : ''} | ${c.analysis_weaknesses ? `Weaknesses: ${c.analysis_weaknesses.join(', ')}` : ''}`).join('\n\n');

  const userPrompt = `Job Description Context:
${jobDescription || 'Standard engineering role'}

Candidate Pool:
${profiles}

Your objectives:
1. Generate an internal dialogue (transcript) where the stakeholders argue for and against the candidates.
2. The Tech Lead focuses on skills/weaknesses, HR on team fit/red flags, CEO on ROI and overall capability.
3. Unanimously establish a single clear "winner_name".
4. Provide a "final_verdict" paragraph justifying the decision.

Expected strictly formatted JSON response schema:
{
  "transcript": [
    {"speaker": "Tech Lead", "dialogue": "..." },
    {"speaker": "HR Director", "dialogue": "..." }
  ],
  "winner_name": "Name",
  "final_verdict": "..."
}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FEATHERLESS_API_KEY || 'rc_952fa543ebf37f2cf8fe8d7afb15cdec2d227f9eab2ea5d96d43cb024cb9a791'}`
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Featherless API Error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  try {
    return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (e) {
    throw new Error('AI failed to parse debate JSON.');
  }
}
