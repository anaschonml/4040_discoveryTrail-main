// Creates an invite link without Twilio, for testing.
// Usage: npm run invite:create -- <phone> [code]
// With a code, it claims that code the same way an incoming text would.
// Without one, the invite only accepts TEST_PASSWORD.
const { getClient, getDb } = require('../lib/db');
const { claimCode, createInvite } = require('../lib/invites');

const [phone, code] = process.argv.slice(2);
const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

(async () => {
  try {
    if (!phone) throw new Error('Usage: npm run invite:create -- <phone> [code]');

    let invite;
    if (code) {
      const result = await claimCode(code, phone);
      if (result.status !== 'ok') throw new Error(`Code ${code} is ${result.status}`);
      invite = result.invite;
    } else {
      invite = await createInvite(await getDb(), { phone });
    }
    console.log(`${baseUrl}/invite/${invite._id}`);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    const client = await getClient().catch(() => null);
    if (client) await client.close();
  }
})();
