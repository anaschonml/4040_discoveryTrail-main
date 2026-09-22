const test = require('node:test');
const assert = require('node:assert/strict');

const { createInitialState, assignPlayerToTeam, createRandomTeamName, normalizePageId, isValidPage, getPageIds, getPageInfo } = require('../lib/state');

test('assignPlayerToTeam creates a solo team with a five-letter name', () => {
  const state = createInitialState();
  const playerId = 'player-solo';

  const result = assignPlayerToTeam(state, playerId, {
    mode: 'solo',
    firstName: 'Ada',
    lastName: 'Lovelace',
  });

  assert.equal(result.createdTeam, true);
  assert.match(result.teamName, /^[A-Za-z]{5}$/);
  assert.deepEqual(state.teams[result.teamName].members, [playerId]);
  assert.equal(state.players[playerId].team, result.teamName);
  assert.equal(state.players[playerId].firstName, 'Ada');
  assert.equal(state.players[playerId].lastName, 'Lovelace');
});

test('assignPlayerToTeam adds a player to an existing team', () => {
  const state = createInitialState();
  const playerId = 'player-join';

  const result = assignPlayerToTeam(state, playerId, { mode: 'join', teamName: 'Red' });

  assert.equal(result.teamName, 'Red');
  assert.deepEqual(state.teams.Red.members, [playerId]);
  assert.equal(state.players[playerId].team, 'Red');
});

test('createRandomTeamName generates a five-character name', () => {
  const name = createRandomTeamName();
  assert.match(name, /^[A-Za-z]{5}$/);
});

test('normalizePageId accepts object paths from the /objects/ folder', () => {
  assert.equal(normalizePageId('/objects/object_example_1.html'), 'object_example_1');
  assert.equal(normalizePageId('objects/object_example_2.html'), 'object_example_2');
  assert.equal(normalizePageId('object_example_1'), 'object_example_1');
  assert.equal(isValidPage('/objects/object_example_1.html'), true);
  assert.equal(isValidPage('object_example_2.html'), true);
});

test('getPageIds discovers object pages from the objects folder', () => {
  const pageIds = getPageIds();
  assert.deepEqual(pageIds, ['object_example_1', 'object_example_2']);
});

test('getPageInfo identifies the point category from an object path', () => {
  assert.deepEqual(getPageInfo('/objects/beep/object_example_1.html'), {
    pageId: 'object_example_1',
    category: 'beep',
    path: 'objects/beep/object_example_1.html',
  });
  assert.equal(getPageInfo('/objects/not-a-category/object_example_1.html'), null);
});

test('new teams have a point total for every category', () => {
  const state = createInitialState();
  assert.deepEqual(state.teams.Red.categoryPoints, { beep: 0, bot: 0, brave: 0 });
});
