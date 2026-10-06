const { withState, isValidPage } = require('../lib/state');

async function visit(req, res) {
  const { playerId, pageId } = req.body || {};

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (!pageId || !isValidPage(pageId)) {
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
      const isNewVisit = !team.visitedPages.includes(pageId);

      if (isNewVisit) {
        team.visitedPages.push(pageId);
        team.points += 1;
      }

      return {
        team: teamName,
        points: team.points,
        pop: team.pop,
        isNewVisit,
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
