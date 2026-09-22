const PLAYER_ID_KEY = 'discoveryTrail_playerId';
const TEAM_KEY = 'discoveryTrail_team';
const PLAYER_PROFILE_KEY = 'discoveryTrail_playerProfile';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'player-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function getTeam() {
  return localStorage.getItem(TEAM_KEY);
}

function setTeam(name) {
  localStorage.setItem(TEAM_KEY, name);
}

function clearTeam() {
  localStorage.removeItem(TEAM_KEY);
}

function getPlayerProfile() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_PROFILE_KEY)) || null;
  } catch (err) {
    return null;
  }
}

function setPlayerProfile(profile) {
  localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
}
