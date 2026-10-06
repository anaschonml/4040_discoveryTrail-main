// Outgoing texts. Twilio is wired in later; until then messages are logged.
async function sendSms(to, body) {
  console.log(`[sms] (not sent, Twilio not configured) to ${to}:\n${body}`);
  return { sent: false };
}

function roomMessage(room) {
  return [
    `You're in. ${room.name}.`,
    `${room.date}, ${room.time}`,
    `Where: ${room.location}`,
    room.instructions,
  ].join('\n');
}

module.exports = { sendSms, roomMessage };
