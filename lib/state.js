const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '..', 'data', 'state.json');

const TEAM_NAMES = ['Red', 'Orange', 'Yellow'];
const POINT_CATEGORIES = ['beep', 'bot', 'brave'];

const OBJECTS_DIR = path.join(__dirname, '..', 'objects');

function getPageIds() {
  if (!fs.existsSync(OBJECTS_DIR)) {
    return [];
  }

  return [...new Set(getObjectPages().map(({ pageId }) => pageId))];
}

function getObjectPages() {
  return POINT_CATEGORIES.flatMap((category) => {
    const categoryDir = path.join(OBJECTS_DIR, category);
    if (!fs.existsSync(categoryDir)) return [];

    return fs.readdirSync(categoryDir)
      .filter((fileName) => fileName.toLowerCase().endsWith('.html'))
      .map((fileName) => ({
        pageId: normalizePageId(fileName),
        category,
        path: `objects/${category}/${fileName}`,
      }))
      .filter(({ pageId }) => pageId);
  });
}

const PAGE_IDS = getPageIds();

function createInitialState() {
  const teams = {};
  for (const name of TEAM_NAMES) {
    teams[name] = createTeamRecord();
  }
  return { teams, players: {} };
}

function createTeamRecord() {
  return { pop: 0, points: 0, categoryPoints: createCategoryPoints(), visitedPages: [], members: [] };
}

function createCategoryPoints() {
  return Object.fromEntries(POINT_CATEGORIES.map((category) => [category, 0]));
}

function createRandomTeamName(existingNames = []) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let name = '';
  do {
    name = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (existingNames.includes(name));
  return name;
}

function normalizeState(state) {
  if (!state || typeof state !== 'object') {
    state = { teams: {}, players: {} };
  }
  if (!state.teams || typeof state.teams !== 'object') {
    state.teams = {};
  }
  if (!state.players || typeof state.players !== 'object') {
    state.players = {};
  }

  for (const [name, team] of Object.entries(state.teams)) {
    if (!team || typeof team !== 'object') {
      state.teams[name] = createTeamRecord();
      continue;
    }

    team.pop = typeof team.pop === 'number' ? team.pop : (Array.isArray(team.members) ? team.members.length : 0);
    team.points = typeof team.points === 'number' ? team.points : 0;
    team.categoryPoints = normalizeCategoryPoints(team.categoryPoints);
    team.visitedPages = Array.isArray(team.visitedPages) ? team.visitedPages : [];
    team.members = Array.isArray(team.members) ? team.members : [];
  }

  for (const player of Object.values(state.players)) {
    if (!player || typeof player !== 'object') continue;
    player.firstName = typeof player.firstName === 'string' ? player.firstName : '';
    player.lastName = typeof player.lastName === 'string' ? player.lastName : '';
  }

  return state;
}

function normalizeCategoryPoints(categoryPoints) {
  const normalized = createCategoryPoints();
  if (!categoryPoints || typeof categoryPoints !== 'object') return normalized;

  for (const category of POINT_CATEGORIES) {
    if (typeof categoryPoints[category] === 'number') {
      normalized[category] = categoryPoints[category];
    }
  }
  return normalized;
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    const initial = createInitialState();
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }

  const parsed = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  return normalizeState(parsed);
}

let writeQueue = Promise.resolve();

function withState(mutator) {
  writeQueue = writeQueue.then(async () => {
    const state = loadState();
    const result = await mutator(state);
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    return result;
  });
  return writeQueue;
}

function isValidTeam(teamName) {
  return typeof teamName === 'string' && teamName.trim().length > 0;
}

function assignPlayerToTeam(state, playerId, options = {}) {
  const normalized = normalizeState(state);
  const firstName = String(options.firstName || '').trim();
  const lastName = String(options.lastName || '').trim();
  const existing = normalized.players[playerId];
  if (existing) {
    existing.firstName = firstName || existing.firstName;
    existing.lastName = lastName || existing.lastName;
    const team = normalized.teams[existing.team];
    if (!team) {
      delete normalized.players[playerId];
    } else {
      return {
        team: existing.team,
        points: team.points,
        categoryPoints: team.categoryPoints,
        pop: team.pop,
        alreadyJoined: true,
        createdTeam: false,
        teamName: existing.team,
      };
    }
  }

  const mode = options.mode || 'join';
  const requestedTeamName = options.teamName ? String(options.teamName).trim() : '';

  if (mode === 'solo' || mode === 'create') {
    const teamName = createRandomTeamName(Object.keys(normalized.teams));
    const team = normalized.teams[teamName] = createTeamRecord();
    team.members.push(playerId);
    team.pop = team.members.length;
    normalized.players[playerId] = {
      team: teamName,
      firstName,
      lastName,
      joinedAt: new Date().toISOString(),
    };
    return {
      team: teamName,
      points: team.points,
      categoryPoints: team.categoryPoints,
      pop: team.pop,
      alreadyJoined: false,
      createdTeam: true,
      mode,
      teamName,
    };
  }

  if (mode === 'join') {
    if (!requestedTeamName) {
      throw new Error('Team name is required');
    }
    if (!normalized.teams[requestedTeamName]) {
      throw new Error('Invalid team name');
    }

    const team = normalized.teams[requestedTeamName];
    if (!team.members.includes(playerId)) {
      team.members.push(playerId);
      team.pop = team.members.length;
    }

    normalized.players[playerId] = {
      team: requestedTeamName,
      firstName,
      lastName,
      joinedAt: new Date().toISOString(),
    };
    return {
      team: requestedTeamName,
      points: team.points,
      categoryPoints: team.categoryPoints,
      pop: team.pop,
      alreadyJoined: false,
      createdTeam: false,
      mode: 'join',
      teamName: requestedTeamName,
    };
  }

  throw new Error('Unsupported team mode');
}

function normalizePageId(pageId) {
  if (typeof pageId !== 'string') {
    return null;
  }

  const trimmed = pageId.trim();
  if (!trimmed) {
    return null;
  }

  const withoutHash = trimmed.split('#')[0].split('?')[0];
  const pathOnly = withoutHash.replace(/^\/+/, '').replace(/\\/g, '/');
  const basename = pathOnly.split('/').pop() || pathOnly;
  return basename.replace(/\.html?$/i, '');
}

function isValidPage(pageId) {
  return Boolean(getPageInfo(pageId)) || getPageIds().includes(normalizePageId(pageId));
}

function getPageInfo(pageId) {
  if (typeof pageId !== 'string') return null;

  const normalizedPath = pageId.trim().replace(/^\/+/, '').replace(/\\/g, '/').split('#')[0].split('?')[0];
  const objectPage = getObjectPages().find(({ path }) => path === normalizedPath);
  if (objectPage) return objectPage;

  if (normalizedPath.includes('/')) return null;

  const normalizedId = normalizePageId(pageId);
  const matches = getObjectPages().filter(({ pageId: knownPageId }) => knownPageId === normalizedId);
  return matches.length === 1 ? matches[0] : null;
}

module.exports = {
  TEAM_NAMES,
  POINT_CATEGORIES,
  PAGE_IDS,
  getPageIds,
  getPageInfo,
  loadState,
  withState,
  isValidTeam,
  normalizePageId,
  isValidPage,
  createInitialState,
  createRandomTeamName,
  assignPlayerToTeam,
};
