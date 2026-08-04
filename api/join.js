const { withState, assignPlayerToTeam } = require('../lib/state');

async function join(req, res) {
  const { playerId, teamName, mode } = req.body || {};

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'playerId is required' });
  }

  const selectedMode = mode || (teamName ? 'join' : undefined);
  if (!selectedMode || !['solo', 'create', 'join'].includes(selectedMode)) {
    return res.status(400).json({ error: 'Invalid team mode' });
  }

  if (selectedMode === 'join' && (!teamName || typeof teamName !== 'string')) {
    return res.status(400).json({ error: 'Team name is required' });
  }

  try {
    const result = await withState((state) => assignPlayerToTeam(state, playerId, { mode: selectedMode, teamName }));
    res.json(result);
  } catch (err) {
    console.error('join error:', err);
    if (err.message === 'Team name is required' || err.message === 'Invalid team name' || err.message === 'Unsupported team mode') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = join;
