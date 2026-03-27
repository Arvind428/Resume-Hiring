/**
 * Signal Scoring Engine
 * Converts raw GitHub data + profile data into 5-dimension scores (0–100)
 */
export function computeSignalScores({ githubData, candidate }) {
  const g = githubData || {};
  const skills = candidate.skills || [];
  const hasPortfolio = !!candidate.portfolio_url;

  // TECHNICAL (0–100)
  const repoScore = Math.min(g.public_repos || 0, 30) * (10 / 30); // max 10
  const commitScore = Math.min(g.recent_repos_90d || 0, 20) * (10 / 20); // max 10
  const starScore = Math.min(g.total_stars || 0, 50) / 50 * 10; // max 10
  const technicalRaw = repoScore + commitScore + starScore; // max 30
  const technical = Math.round((technicalRaw / 30) * 100);

  // COMMUNICATION (0–100)
  const portfolioBonus = hasPortfolio ? 20 : 0;
  const skillsScore = Math.min(skills.length, 10) * 5; // max 50
  const bioScore = g.bio ? 15 : 0;
  const blogScore = g.blog ? 15 : 0;
  const communicationRaw = portfolioBonus + skillsScore + bioScore + blogScore; // max 100
  const communication = Math.min(Math.round(communicationRaw), 100);

  // CREATIVITY (0–100)
  const topicsScore = Math.min(g.unique_topics || 0, 10) * 5; // max 50
  const portfolioGithubBonus = (hasPortfolio && (g.public_repos || 0) > 0) ? 30 : 0;
  const diversityBonus = (g.unique_topics || 0) > 5 ? 20 : 0;
  const creativityRaw = topicsScore + portfolioGithubBonus + diversityBonus; // max 100
  const creativity = Math.min(Math.round(creativityRaw), 100);

  // CULTURE FIT (0–100) — heuristic
  const activeBonus = (g.recent_repos_30d || 0) > 0 ? 25 : 0;
  const communityBonus = Math.min((g.followers || 0), 50) / 50 * 25;
  const skillsDiversityBonus = skills.length >= 5 ? 30 : skills.length * 6;
  const roleAlignmentBonus = 20; // base for applying
  const cultureFitRaw = activeBonus + communityBonus + skillsDiversityBonus + roleAlignmentBonus;
  const cultureFit = Math.min(Math.round(cultureFitRaw), 100);

  // GROWTH POTENTIAL (0–100)
  const ageBonus = (g.account_age_years || 0) >= 2 ? 30 : Math.round((g.account_age_years || 0) * 15);
  const recentActivityBonus = (g.recent_repos_30d || 0) > 0 ? 35 : 0;
  const learningBonus = (g.unique_topics || 0) > 3 ? 35 : Math.round((g.unique_topics || 0) * 10);
  const growthRaw = ageBonus + recentActivityBonus + learningBonus;
  const growth = Math.min(Math.round(growthRaw), 100);

  const total = Math.round((technical + communication + creativity + cultureFit + growth) / 5);

  return {
    score_technical: technical,
    score_communication: communication,
    score_creativity: creativity,
    score_culture_fit: cultureFit,
    score_growth: growth,
    total_score: total
  };
}

// Fallback when GitHub is unavailable
export function estimateScores(candidate) {
  const skills = candidate.skills || [];
  const base = 40;
  const skillsBonus = Math.min(skills.length * 4, 30);
  const portfolioBonus = candidate.portfolio_url ? 10 : 0;
  const githubBonus = candidate.github_url ? 10 : 0;
  const total = base + skillsBonus + portfolioBonus + githubBonus;

  return {
    score_technical: Math.min(total + Math.round(Math.random() * 10 - 5), 100),
    score_communication: Math.min(total + Math.round(Math.random() * 10 - 5), 100),
    score_creativity: Math.min(total - 5 + Math.round(Math.random() * 10), 100),
    score_culture_fit: Math.min(total + Math.round(Math.random() * 10 - 5), 100),
    score_growth: Math.min(total + Math.round(Math.random() * 10 - 5), 100),
    total_score: Math.min(total, 100),
    estimated: true
  };
}
