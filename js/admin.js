const POLL_INTERVAL_MS = 5000;

async function fetchAdminTeams() {
  const res = await fetch('/api/admin/teams');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

function renderTable(teams) {
  const tbody = document.getElementById('teams-body');
  tbody.innerHTML = '';

  for (const team of teams) {
    const row = document.createElement('tr');
    row.className = 'team-row team-' + team.name.toLowerCase();

    const visited = team.visitedPages || [];
    const pages = visited.length ? visited.join(', ') : '—';
    const categoryPoints = team.categoryPoints || {};
    const points = `beep: ${categoryPoints.beep || 0}, bot: ${categoryPoints.bot || 0}, brave: ${categoryPoints.brave || 0}`;

    row.innerHTML = `
      <td class="admin-team-name">${team.name}</td>
      <td>${team.pop}</td>
      <td>${points}<br>Total: ${team.points}</td>
      <td class="admin-pages">${pages}</td>
    `;
    tbody.appendChild(row);
  }
}

async function refresh() {
  const updatedEl = document.getElementById('last-updated');
  try {
    const data = await fetchAdminTeams();
    renderTable(data.teams);
    updatedEl.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    updatedEl.classList.remove('error');
  } catch (err) {
    console.error(err);
    updatedEl.textContent = 'Could not load team data. ' + (err.message || '');
    updatedEl.classList.add('error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refresh();
  setInterval(refresh, POLL_INTERVAL_MS);
});
