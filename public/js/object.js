document.addEventListener('DOMContentLoaded', async () => {
  getPlayerId();

  const pageId = document.body.dataset.pageId;
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
