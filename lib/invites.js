const crypto = require('crypto');
const { getDb } = require('./db');

// Collections:
//   codes:   { _id: code, phone, token, claimedAt }             one per secret code
//   invites: { _id: token, code, phone, createdAt, openedAt,
//              answers, room, submittedAt, smsSentAt }          one per guest

function newToken() {
  return crypto.randomBytes(16).toString('base64url');
}

// "Inflatable shark", "inflatable-shark" and "INFLATABLESHARK" all match.
function normalizeCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function createInvite(db, { code, phone }) {
  const invite = { _id: newToken(), code: code || null, phone, createdAt: new Date() };
  await db.collection('invites').insertOne(invite);
  return invite;
}

// A code can be claimed by one phone number. Texting it again from the same
// number returns the same invite.
// Returns { status: 'ok', invite } | { status: 'invalid' } | { status: 'taken' }.
async function claimCode(rawCode, phone) {
  const db = await getDb();
  const code = normalizeCode(rawCode);
  const codes = db.collection('codes');

  const existing = await codes.findOne({ _id: code });
  if (!existing) return { status: 'invalid' };

  if (existing.phone) {
    if (existing.phone !== phone) return { status: 'taken' };
    const invite = await db.collection('invites').findOne({ _id: existing.token });
    return { status: 'ok', invite };
  }

  // Claim atomically so two people texting the same code at once can't both win.
  const token = newToken();
  const claimed = await codes.findOneAndUpdate(
    { _id: code, phone: null },
    { $set: { phone, token, claimedAt: new Date() } },
  );
  if (!claimed) return claimCode(rawCode, phone);

  const invite = { _id: token, code, phone, createdAt: new Date() };
  await db.collection('invites').insertOne(invite);
  return { status: 'ok', invite };
}

async function getInvite(token) {
  if (typeof token !== 'string' || token.length > 64) return null;
  const db = await getDb();
  return db.collection('invites').findOne({ _id: token });
}

async function markOpened(token) {
  const db = await getDb();
  await db.collection('invites').updateOne(
    { _id: token, openedAt: { $exists: false } },
    { $set: { openedAt: new Date() } },
  );
}

// Saves answers and room once. Returns the stored invite; if it was already
// submitted, the earlier submission wins.
async function saveRsvp(token, answers, room) {
  const db = await getDb();
  const invites = db.collection('invites');
  const updated = await invites.findOneAndUpdate(
    { _id: token, submittedAt: { $exists: false } },
    { $set: { answers, room, submittedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return updated || invites.findOne({ _id: token });
}

async function markSmsSent(token) {
  const db = await getDb();
  await db.collection('invites').updateOne({ _id: token }, { $set: { smsSentAt: new Date() } });
}

module.exports = {
  normalizeCode,
  createInvite,
  claimCode,
  getInvite,
  markOpened,
  saveRsvp,
  markSmsSent,
};
