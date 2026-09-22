function normalizePageId(pageId) {
  if (typeof pageId !== 'string') return null;

  const trimmed = pageId.trim();
  if (!trimmed) return null;

  const withoutHash = trimmed.split('#')[0].split('?')[0];
  const pathOnly = withoutHash.replace(/^\/+/, '').replace(/\\/g, '/');
  const basename = pathOnly.split('/').pop() || pathOnly;
  return basename.replace(/\.html?$/i, '');
}

document.addEventListener('DOMContentLoaded', async () => {
  getPlayerId();

  const pageId = window.location.pathname;
  if (!pageId) return;

  const team = getTeam();
  if (!team) {
    window.location.href = '/index.html';
    return;
  }

  const statusEl = ensureTeamStatusElement();

  try {
    const result = await recordVisit(pageId);
    setTeam(result.team);
    renderTeamBadge(statusEl, result);
    if (result.hasWon) {
      window.location.href = '/win_condition.html';
    }
  } catch (err) {
    console.error(err);
    if (err.message && err.message.includes('not joined')) {
      clearTeam();
      window.location.href = '/index.html';
      return;
    }
    renderTeamBadge(statusEl, { team, points: '—', pop: undefined });
  }
});
