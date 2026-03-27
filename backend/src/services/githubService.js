import fetch from 'node-fetch';

const GH_API = 'https://api.github.com';

function getHeaders() {
  const headers = { 'User-Agent': 'HiringSystem/1.0', 'Accept': 'application/vnd.github.v3+json' };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

export async function fetchGithubData(githubUrl) {
  try {
    const username = extractUsername(githubUrl);
    if (!username) return null;

    const [userRes, reposRes] = await Promise.all([
      fetch(`${GH_API}/users/${username}`, { headers: getHeaders() }),
      fetch(`${GH_API}/users/${username}/repos?per_page=100&sort=updated`, { headers: getHeaders() })
    ]);

    if (!userRes.ok) return null;

    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];

    const now = new Date();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const recentRepos = Array.isArray(repos)
      ? repos.filter(r => new Date(r.pushed_at) > ninetyDaysAgo)
      : [];
    const veryRecentRepos = Array.isArray(repos)
      ? repos.filter(r => new Date(r.pushed_at) > thirtyDaysAgo)
      : [];

    const totalStars = Array.isArray(repos)
      ? repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0)
      : 0;

    const topics = Array.isArray(repos)
      ? [...new Set(repos.flatMap(r => r.topics || []))]
      : [];

    const accountAge = (now - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365);

    return {
      username,
      public_repos: user.public_repos || 0,
      followers: user.followers || 0,
      recent_repos_90d: recentRepos.length,
      recent_repos_30d: veryRecentRepos.length,
      total_stars: totalStars,
      unique_topics: topics.length,
      account_age_years: Math.round(accountAge * 10) / 10,
      bio: user.bio || '',
      blog: user.blog || '',
    };
  } catch (err) {
    console.warn('[GitHub] Fetch failed:', err.message);
    return null;
  }
}

function extractUsername(url) {
  if (!url) return null;
  const match = url.match(/github\.com\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
