const { getDb } = require('../lib/db');
const { getInvite, createInvite, markOpened, saveRsvp, markSmsSent } = require('../lib/invites');
const { QUESTIONS, validateAnswers, normalizePhone, isCorrectPassword } = require('../lib/questions');
const { assignRoom } = require('../lib/assign');
const { getRoom } = require('../lib/rooms');
const { sendSms, roomMessage } = require('../lib/sms');

// GET /api/invite/:token
async function getInviteHandler(req, res) {
  try {
    const invite = await getInvite(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Not found' });

    await markOpened(invite._id);

    if (invite.submittedAt) {
      return res.json({ status: 'submitted', name: invite.answers.name, room: getRoom(invite.room) });
    }
    res.json({ status: 'open', questions: QUESTIONS });
  } catch (err) {
    console.error('get invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/invite/:token/rsvp  { answers }
async function rsvpHandler(req, res) {
  try {
    const invite = await getInvite(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Not found' });

    if (invite.submittedAt) {
      return res.json({ status: 'submitted', name: invite.answers.name, room: getRoom(invite.room) });
    }

    const { answers, error } = validateAnswers((req.body || {}).answers, invite);
    if (error) return res.status(400).json({ error });

    const roomId = await assignRoom(invite, answers);
    const saved = await saveRsvp(invite._id, answers, roomId);
    const room = getRoom(saved.room);

    // Only text on the submission that actually saved.
    if (saved.room === roomId && !saved.smsSentAt) {
      try {
        const { sent } = await sendSms(saved.answers.phone, roomMessage(room));
        if (sent) await markSmsSent(invite._id);
      } catch (err) {
        console.error('confirmation sms error:', err);
      }
    }

    res.json({ status: 'submitted', name: saved.answers.name, room });
  } catch (err) {
    console.error('rsvp error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

// POST /api/invite/:token/check  { questionId, value }
// Lets the chat bot reject a wrong password or bad phone number as soon as it's typed.
async function checkAnswerHandler(req, res) {
  try {
    const invite = await getInvite(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Not found' });

    const { questionId, value } = req.body || {};
    if (questionId === 'password') {
      return res.json({ ok: isCorrectPassword(invite, value) });
    }
    if (questionId === 'phone') {
      return res.json({ ok: Boolean(normalizePhone(value)) });
    }
    res.status(400).json({ error: 'Unknown question' });
  } catch (err) {
    console.error('check answer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /test
// Test mode: starts a fresh invite on every visit, so the flow can be tried
// without a texted link. Only available while TEST_PASSWORD is set.
async function testInviteHandler(req, res) {
  if (!process.env.TEST_PASSWORD) return res.status(404).send('Not found');
  try {
    const invite = await createInvite(await getDb(), { test: true });
    res.redirect(302, `/invite/${invite._id}`);
  } catch (err) {
    console.error('test invite error:', err);
    res.status(500).send('Could not start a test invite.');
  }
}

module.exports = { getInviteHandler, rsvpHandler, checkAnswerHandler, testInviteHandler };
