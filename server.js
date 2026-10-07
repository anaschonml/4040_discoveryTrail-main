const express = require('express');
const path = require('path');

const joinHandler = require('./routes/join');
const visitHandler = require('./routes/visit');
const teamsHandler = require('./routes/teams');
const adminTeamsHandler = require('./routes/admin');
const { getInviteHandler, rsvpHandler, checkAnswerHandler, testInviteHandler } = require('./routes/invite');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/join', joinHandler);
app.post('/api/visit', visitHandler);
app.get('/api/teams', teamsHandler);
app.get('/api/admin/teams', adminTeamsHandler);
app.get('/api/invite/:token', getInviteHandler);
app.post('/api/invite/:token/rsvp', rsvpHandler);
app.post('/api/invite/:token/check', checkAnswerHandler);

app.get('/test', testInviteHandler);

// On Vercel, vercel.json rewrites /invite/:token to the same page.
app.get('/invite/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invite.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Discovery Trail server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
