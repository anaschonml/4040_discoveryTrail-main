// Loads secret codes into MongoDB. Usage: npm run codes:import [-- path/to/codes.csv]
// Reads the first column of each row (normalized the same way guests' answers
// are, so "inflatable shark" is stored as INFLATABLESHARK); a header row is skipped.
// Safe to re-run: existing codes (and who claimed them) are left alone.
const fs = require('fs');
const path = require('path');
const { getClient, getDb } = require('../lib/db');
const { normalizeCode } = require('../lib/invites');

const csvPath = process.argv[2] || path.join(__dirname, '..', 'data', 'codes.csv');

(async () => {
  try {
    const codes = [...new Set(
      fs.readFileSync(csvPath, 'utf8')
        .split(/\r?\n/)
        .map((line) => normalizeCode(line.split(',')[0].replace(/"/g, '')))
        .filter((code) => code && code !== 'CODE'),
    )];

    const db = await getDb();
    const result = await db.collection('codes').bulkWrite(
      codes.map((code) => ({
        updateOne: {
          filter: { _id: code },
          update: { $setOnInsert: { phone: null, token: null } },
          upsert: true,
        },
      })),
    );
    const total = await db.collection('codes').countDocuments();
    console.log(`Read ${codes.length} codes from ${csvPath}: ${result.upsertedCount} new. ` +
      `"${db.databaseName}" now has ${total} codes.`);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exitCode = 1;
  } finally {
    const client = await getClient().catch(() => null);
    if (client) await client.close();
  }
})();
