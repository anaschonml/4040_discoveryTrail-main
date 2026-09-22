const POLL_INTERVAL_MS = 5000;

function hasWon(categoryPoints = {}) {
  return ['beep', 'bot', 'brave'].every((category) => categoryPoints[category] >= 1);
}

async function redirectIfWinningTeam(teamName) {
  const data = await fetchTeams();
  const stats = data.teams[teamName];
  if (!stats || !hasWon(stats.categoryPoints)) return false;

  window.location.replace('/win_condition.html');
  return true;
}

function renderJoinedView(container, { team, points, categoryPoints, pop }) {
  const categorySummary = categoryPoints
    ? `beep: ${categoryPoints.beep || 0} · bot: ${categoryPoints.bot || 0} · brave: ${categoryPoints.brave || 0}`
    : '';
  container.innerHTML = `
    <div class="joined-message">
      <p>You're on <strong>Team ${team}</strong></p>
      <p>${pop} player${pop !== 1 ? 's' : ''} · ${points} point${points !== 1 ? 's' : ''}</p>
      ${categorySummary ? `<p class="joined-category-points">${categorySummary}</p>` : ''}
      <p class="joined-hint">Scan QR codes around the space to discover objects and earn points for your team.</p>
    </div>
  `;
  renderTeamBadge(ensureTeamStatusElement(), { team, points, categoryPoints, pop });
}

function renderNameScreen(container) {
  container.innerHTML = `
    <form id="player-name-form" class="team-choice-card">
      <h2>Tell us your name</h2>
      <label for="first-name-input">First name</label>
      <input id="first-name-input" name="firstName" type="text" autocomplete="given-name" required />
      <label for="last-name-input">Last name</label>
      <input id="last-name-input" name="lastName" type="text" autocomplete="family-name" required />
      <button type="submit" class="choice-button">Continue</button>
    </form>
  `;

  document.getElementById('player-name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const firstName = document.getElementById('first-name-input').value.trim();
    const lastName = document.getElementById('last-name-input').value.trim();
    if (!firstName || !lastName) return;
    const profile = { firstName, lastName };
    setPlayerProfile(profile);
    renderChoiceScreen(container, profile);
  });
}

function renderChoiceScreen(container, profile) {
  container.innerHTML = `
    <div class="team-choice-card">
      <h2>How do you want to play?</h2>
      <button class="choice-button" id="play-solo-button">Play solo</button>
      <button class="choice-button" id="team-options-button">Create or join a team</button>
    </div>
  `;

  const soloButton = document.getElementById('play-solo-button');
  const teamButton = document.getElementById('team-options-button');

  soloButton.addEventListener('click', () => handleSoloStart(container, profile));
  teamButton.addEventListener('click', () => renderTeamOptionsScreen(container, profile));
}

function renderTeamOptionsScreen(container, profile) {
  container.innerHTML = `
    <div class="team-choice-card">
      <h2>Create or join a team</h2>
      <button class="choice-button" id="create-team-button">Create a new team</button>
      <form id="join-team-form" class="join-team-form">
        <label for="team-name-input">Join an existing team</label>
        <input id="team-name-input" name="teamName" type="text" placeholder="Enter team name" required />
        <button type="submit" class="choice-button">Join a team</button>
      </form>
      <button class="secondary-button" id="back-to-selection-button">Back</button>
    </div>
  `;

  document.getElementById('create-team-button').addEventListener('click', () => handleCreateTeam(container, profile));
  document.getElementById('join-team-form').addEventListener('submit', (event) => handleJoinTeam(event, container, profile));
  document.getElementById('back-to-selection-button').addEventListener('click', () => renderChoiceScreen(container, profile));
}

async function handleSoloStart(container, profile) {
  const button = document.getElementById('play-solo-button');
  if (button) {
    button.disabled = true;
  }

  try {
    const result = await joinTeam({ ...profile, mode: 'solo' });
    setTeam(result.team);
    renderJoinedView(container, result);
  } catch (err) {
    console.error(err);
    if (button) {
      button.disabled = false;
    }
    alert(err.message || 'Failed to start solo play');
  }
}

async function handleCreateTeam(container, profile) {
  const button = document.getElementById('create-team-button');
  if (button) {
    button.disabled = true;
  }

  try {
    const result = await joinTeam({ ...profile, mode: 'create' });
    setTeam(result.team);
    renderJoinedView(container, result);
  } catch (err) {
    console.error(err);
    if (button) {
      button.disabled = false;
    }
    alert(err.message || 'Failed to create a team');
  }
}

async function handleJoinTeam(event, container, profile) {
  event.preventDefault();

  const input = document.getElementById('team-name-input');
  const button = document.querySelector('#join-team-form button[type="submit"]');
  const teamName = input.value.trim();

  if (!teamName) {
    alert('Please enter the name of the team you want to join.');
    return;
  }

  if (button) {
    button.disabled = true;
  }

  try {
    const result = await joinTeam({ ...profile, mode: 'join', teamName });
    setTeam(result.team);
    renderJoinedView(container, result);
  } catch (err) {
    console.error(err);
    if (button) {
      button.disabled = false;
    }
    alert(err.message || 'Failed to join team');
  }
}

async function refreshJoinedTeamUI(container, joinedTeam) {
  try {
    const data = await fetchTeams();
    const stats = data.teams[joinedTeam];
    if (stats) {
      renderJoinedView(container, { team: joinedTeam, points: stats.points, categoryPoints: stats.categoryPoints, pop: stats.pop });
    } else {
      renderNameScreen(container);
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error">Could not load teams. Please refresh the page.</p>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  getPlayerId();
  const container = document.getElementById('teams');
  const joinedTeam = getTeam();

  if (!container) {
    if (joinedTeam) {
      try {
        await redirectIfWinningTeam(joinedTeam);
      } catch (err) {
        console.error(err);
      }
    }
    return;
  }

  if (joinedTeam) {
    await refreshJoinedTeamUI(container, joinedTeam);
  } else {
    const profile = getPlayerProfile();
    if (profile && profile.firstName && profile.lastName) {
      renderChoiceScreen(container, profile);
    } else {
      renderNameScreen(container);
    }
  }

  setInterval(async () => {
    const currentTeam = getTeam();
    if (currentTeam) {
      await refreshJoinedTeamUI(container, currentTeam);
    }
  }, POLL_INTERVAL_MS);
});
