const express = require('express');
const path = require('path');

const joinHandler = require('./api/join');
const visitHandler = require('./api/visit');
const teamsHandler = require('./api/teams');
const adminTeamsHandler = require('./api/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/join', joinHandler);
app.post('/api/visit', visitHandler);
app.get('/api/teams', teamsHandler);
app.get('/api/admin/teams', adminTeamsHandler);

app.use(express.static(path.join(__dirname, 'public')));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Discovery Trail server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
