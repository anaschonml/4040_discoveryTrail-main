const POLL_INTERVAL_MS = 5000;

function renderJoinedView(container, { team, points, pop }) {
  container.innerHTML = `
    <div class="joined-message">
      <p>You're on <strong>Team ${team}</strong></p>
      <p>${pop} player${pop !== 1 ? 's' : ''} · ${points} point${points !== 1 ? 's' : ''}</p>
      <p class="joined-hint">Scan QR codes around the space to discover objects and earn points for your team.</p>
    </div>
  `;
  renderTeamBadge(ensureTeamStatusElement(), { team, points, pop });
}

function renderChoiceScreen(container) {
  container.innerHTML = `
    <div class="team-choice-card">
      <h2>How do you want to play?</h2>
      <button class="choice-button" id="play-solo-button">Play solo</button>
      <button class="choice-button" id="team-options-button">Create or join a team</button>
    </div>
  `;

  const soloButton = document.getElementById('play-solo-button');
  const teamButton = document.getElementById('team-options-button');

  soloButton.addEventListener('click', () => handleSoloStart(container));
  teamButton.addEventListener('click', () => renderTeamOptionsScreen(container));
}

function renderTeamOptionsScreen(container) {
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

  document.getElementById('create-team-button').addEventListener('click', () => handleCreateTeam(container));
  document.getElementById('join-team-form').addEventListener('submit', (event) => handleJoinTeam(event, container));
  document.getElementById('back-to-selection-button').addEventListener('click', () => renderChoiceScreen(container));
}

async function handleSoloStart(container) {
  const button = document.getElementById('play-solo-button');
  if (button) {
    button.disabled = true;
  }

  try {
    const result = await joinTeam({ mode: 'solo' });
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

async function handleCreateTeam(container) {
  const button = document.getElementById('create-team-button');
  if (button) {
    button.disabled = true;
  }

  try {
    const result = await joinTeam({ mode: 'create' });
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

async function handleJoinTeam(event, container) {
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
    const result = await joinTeam({ mode: 'join', teamName });
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
      renderJoinedView(container, { team: joinedTeam, points: stats.points, pop: stats.pop });
    } else {
      renderChoiceScreen(container);
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error">Could not load teams. Please refresh the page.</p>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  getPlayerId();
  const container = document.getElementById('teams');
  if (!container) return;

  const joinedTeam = getTeam();

  if (joinedTeam) {
    await refreshJoinedTeamUI(container, joinedTeam);
  } else {
    renderChoiceScreen(container);
  }

  setInterval(async () => {
    const currentTeam = getTeam();
    if (currentTeam) {
      await refreshJoinedTeamUI(container, currentTeam);
    }
  }, POLL_INTERVAL_MS);
});
