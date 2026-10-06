const { getClient, getDb } = require('../lib/db');

(async () => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    console.log(`Connected to MongoDB, database "${db.databaseName}"`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exitCode = 1;
  } finally {
    const client = await getClient().catch(() => null);
    if (client) await client.close();
  }
})();
