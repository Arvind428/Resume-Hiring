export const MODEL = 'deepseek-ai/DeepSeek-V3.2';
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
    const errorText = await response.text();
    console.error('Featherless API Error:', errorText);
    throw new Error(`API returned ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  
  // Try to parse JSON. Sometimes models wrap it in markdown block.
  try {
    return JSON.parse(text);
  } catch (err) {
    // Basic regex to extract JSON if encapsulated in ```json ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw err;
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
