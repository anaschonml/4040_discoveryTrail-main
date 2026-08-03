const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '..', 'data', 'state.json');

const TEAM_NAMES = ['Red', 'Orange', 'Yellow'];

const PAGE_IDS = ['object_example_1', 'object_example_2'];

function createInitialState() {
  const teams = {};
  for (const name of TEAM_NAMES) {
    teams[name] = { pop: 0, points: 0, visitedPages: [] };
  }
  return { teams, players: {} };
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    const initial = createInitialState();
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
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
  return TEAM_NAMES.includes(teamName);
}

function isValidPage(pageId) {
  return PAGE_IDS.includes(pageId);
}

module.exports = {
  TEAM_NAMES,
  PAGE_IDS,
  loadState,
  withState,
  isValidTeam,
  isValidPage,
  createInitialState,
};
