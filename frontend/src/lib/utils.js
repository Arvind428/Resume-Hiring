export function scoreColor(val, max = 100) {
  const pct = max === 10 ? val * 10 : val;
  if (pct >= 70) return '#10B981';
  if (pct >= 45) return '#F59E0B';
  return '#EF4444';
}

export function verdictBadgeClass(verdict) {
  const v = (verdict || '').toLowerCase();
  if (v === 'hire' || v === 'strong_yes') return 'badge-hire';
  if (v === 'yes') return 'badge-strong';
  if (v === 'hold' || v === 'maybe') return 'badge-maybe';
  return 'badge-reject';
}

export function verdictLabel(v) {
  const map = { hire: 'HIRE', hold: 'HOLD', reject: 'REJECT', strong_yes: 'STRONG YES', yes: 'YES', maybe: 'MAYBE', no: 'NO' };
  return map[(v || '').toLowerCase()] || (v || '').toUpperCase();
}

export function dimensionLabel(key) {
  const map = {
    score_technical: 'Technical', score_communication: 'Communication',
    score_creativity: 'Creativity', score_culture_fit: 'Culture Fit', score_growth: 'Growth',
    technical_skill: 'Technical Skill', communication: 'Communication',
    culture_fit: 'Culture Fit', leadership: 'Leadership', growth_potential: 'Growth Potential',
    depth: 'Depth', clarity: 'Clarity', creativity: 'Creativity', honesty: 'Honesty'
  };
  return map[key] || key;
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getInitials(name) {
  return (name || '').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
