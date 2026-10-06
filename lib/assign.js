const { ROOM_IDS } = require('./rooms');

// Picks a speakeasy room for a guest. If ASSIGN_API_URL is set, the external
// assignment API decides (it also handles room capacity); otherwise a random
// room is returned as a placeholder.
async function assignRoom(invite, answers) {
  const url = process.env.ASSIGN_API_URL;
  if (!url) {
    return ROOM_IDS[Math.floor(Math.random() * ROOM_IDS.length)];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteId: invite._id, answers }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Assignment API returned ${res.status}`);
  }
  const { room } = await res.json();
  if (!ROOM_IDS.includes(room)) {
    throw new Error(`Assignment API returned unknown room: ${room}`);
  }
  return room;
}

module.exports = { assignRoom };
