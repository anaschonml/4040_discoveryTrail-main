const { withState, assignPlayerToTeam } = require('../lib/state');

async function join(req, res) {
  const { playerId, firstName, lastName, teamName, mode } = req.body || {};

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'playerId is required' });
  }
  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    return res.status(400).json({ error: 'First name is required' });
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    return res.status(400).json({ error: 'Last name is required' });
  }

  const selectedMode = mode || (teamName ? 'join' : undefined);
  if (!selectedMode || !['solo', 'create', 'join'].includes(selectedMode)) {
    return res.status(400).json({ error: 'Invalid team mode' });
  }

  if (selectedMode === 'join' && (!teamName || typeof teamName !== 'string')) {
    return res.status(400).json({ error: 'Team name is required' });
  }

  try {
    const result = await withState((state) => assignPlayerToTeam(state, playerId, {
      mode: selectedMode,
      teamName,
      firstName,
      lastName,
    }));
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
