const { withState, getPageInfo } = require('../lib/state');

async function visit(req, res) {
  const { playerId, pageId } = req.body || {};
  const pageInfo = getPageInfo(pageId);

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (!pageInfo) {
    return res.status(400).json({ error: 'Invalid page ID' });
  }

  try {
    const result = await withState((state) => {
      const player = state.players[playerId];
      if (!player) {
        return { error: 'Player has not joined a team', status: 403 };
      }

      const teamName = player.team;
      const team = state.teams[teamName];
      const isNewVisit = !team.visitedPages.includes(pageInfo.path);

      if (isNewVisit) {
        team.visitedPages.push(pageInfo.path);
        team.points += 1;
        team.categoryPoints[pageInfo.category] += 1;
      }

      const hasWon = Object.values(team.categoryPoints).every((points) => points >= 1);

      return {
        team: teamName,
        points: team.points,
        categoryPoints: team.categoryPoints,
        category: pageInfo.category,
        pop: team.pop,
        isNewVisit,
        hasWon,
      };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('visit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = visit;
