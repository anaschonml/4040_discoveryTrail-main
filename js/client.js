async function fetchTeams() {
  const res = await fetch('/api/teams');
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

async function joinTeam(payload) {
  const res = await fetch('/api/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: getPlayerId(), ...payload }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to join team');
  }
  return res.json();
}

async function recordVisit(pageId) {
  const res = await fetch('/api/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: getPlayerId(), pageId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to record visit');
  }
  return res.json();
}

function renderTeamBadge(container, { team, points, categoryPoints = {}, pop, isNewVisit }) {
  if (!container) return;
  
  let html = `<span class="team-name">Team ${team}</span>`;
  html += `<span class="team-points">${points} point${points !== 1 ? 's' : ''}</span>`;
  html += `<span class="team-category-points">beep: ${categoryPoints.beep || 0} · bot: ${categoryPoints.bot || 0} · brave: ${categoryPoints.brave || 0}</span>`;
  html += `<button class="navbutton" onclick="window.location.href='/navigation/menu.html'">Return to search</button>`;
  if (pop !== undefined) {
    html += `<span class="team-pop">${pop} player${pop !== 1 ? 's' : ''}</span>`;
  }
  if (isNewVisit) {
    html += `<span class="team-new-point">+1 point!</span>`;
  }

  container.innerHTML = html;
  container.classList.add('team-status-visible');
}

function ensureTeamStatusElement() {
  let el = document.getElementById('team-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'team-status';
    el.className = 'team-status';
    const header = document.querySelector('header');
    if (header) {
      header.appendChild(el);
    } else {
      document.body.insertBefore(el, document.body.firstChild);
    }
  }
  return el;
}
