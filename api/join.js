const { withState, isValidTeam } = require('../lib/state');

async function join(req, res) {
  const { playerId, teamName } = req.body || {};

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (!teamName || !isValidTeam(teamName)) {
    return res.status(400).json({ error: 'Invalid team name' });
  }

  try {
    const result = await withState((state) => {
      const existing = state.players[playerId];
      if (existing) {
        const team = state.teams[existing.team];
        return {
          team: existing.team,
          points: team.points,
          pop: team.pop,
          alreadyJoined: true,
        };
      }

      state.players[playerId] = { team: teamName, joinedAt: new Date().toISOString() };
      state.teams[teamName].pop += 1;

      const team = state.teams[teamName];
      return {
        team: teamName,
        points: team.points,
        pop: team.pop,
        alreadyJoined: false,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('join error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = join;
