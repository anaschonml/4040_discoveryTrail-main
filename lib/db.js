const { MongoClient } = require('mongodb');

// Reuse one client across requests (and across warm Vercel invocations).
let clientPromise;

function getClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(process.env.MONGODB_URI).connect();
    clientPromise.catch(() => {
      clientPromise = undefined;
    });
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || 'speakeasy_dev');
}

module.exports = { getClient, getDb };
