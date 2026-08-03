const POLL_INTERVAL_MS = 5000;

function renderTeamButtons(teamsData, container, onJoin) {
  container.innerHTML = '';

  const divT = document.createElement('div');
  divT.className = 'teams';

  for (const [name, stats] of Object.entries(teamsData)) {
    const teamButton = document.createElement('button');
    teamButton.className = 'team-button team-' + name.toLowerCase();
    teamButton.innerHTML = `<span class="team-button-name">${name}</span><span class="team-button-pop">${stats.pop} player${stats.pop !== 1 ? 's' : ''}</span>`;
    teamButton.addEventListener('click', () => onJoin(name, teamButton));
    divT.appendChild(teamButton);
  }

  container.appendChild(divT);
}

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

async function refreshTeamsUI(container, joinedTeam) {
  try {
    const data = await fetchTeams();
    if (joinedTeam) {
      const stats = data.teams[joinedTeam];
      if (stats) {
        renderJoinedView(container, { team: joinedTeam, points: stats.points, pop: stats.pop });
      }
    } else {
      renderTeamButtons(data.teams, container, handleJoin);
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error">Could not load teams. Please refresh the page.</p>';
  }
}

async function handleJoin(teamName, button) {
  button.disabled = true;
  try {
    const result = await joinTeam(teamName);
    setTeam(result.team);
    const container = document.getElementById('teams');
    renderJoinedView(container, result);
  } catch (err) {
    console.error(err);
    button.disabled = false;
    alert(err.message || 'Failed to join team');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  getPlayerId();
  const container = document.getElementById('teams');
  if (!container) return;

  const joinedTeam = getTeam();

  if (joinedTeam) {
    await refreshTeamsUI(container, joinedTeam);
  } else {
    await refreshTeamsUI(container, null);
  }

  setInterval(() => refreshTeamsUI(container, getTeam()), POLL_INTERVAL_MS);
});
