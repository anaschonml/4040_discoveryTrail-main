const { loadState } = require('../lib/state');

async function adminTeams(req, res) {
  try {
    const state = loadState();
    const teams = Object.entries(state.teams).map(([name, team]) => ({
      name,
      pop: team.pop,
      points: team.points,
      categoryPoints: team.categoryPoints,
      visitedPages: team.visitedPages || [],
    }));
    res.json({ teams });
  } catch (err) {
    console.error('admin teams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = adminTeams;
