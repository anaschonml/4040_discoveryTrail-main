const { loadState } = require('../lib/state');

async function teams(req, res) {
  try {
    const state = loadState();
    const teamsData = {};
    for (const [name, team] of Object.entries(state.teams)) {
      teamsData[name] = {
        pop: team.pop,
        points: team.points,
      };
    }
    res.json({ teams: teamsData });
  } catch (err) {
    console.error('teams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = teams;
