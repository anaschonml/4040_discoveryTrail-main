const { normalizeCode } = require('./invites');

// The chat bot's questions, in order. The browser renders these and the
// server validates answers against the same list.
// type: 'password' (must match the guest's secret code; checked, not stored),
//       'text', 'longtext', 'phone', or 'choice' (one of `options`).
// showIf: only ask when an earlier answer matches.
const QUESTIONS = [
  {
    id: 'password',
    type: 'password',
    prompt: 'What is your secret password?',
    wrongReply: "That's not it. Try again.",
  },
  {
    id: 'name',
    type: 'text',
    prompt: "Good. You're in. What's your name?",
    maxLength: 80,
  },
  {
    id: 'phone',
    type: 'phone',
    prompt: "What's a good phone number to text you at?",
    invalidReply: "That doesn't look like a phone number. Try again?",
  },
  {
    id: 'relationship',
    type: 'text',
    prompt: 'What is your relationship to the lab?',
    maxLength: 200,
  },
  {
    id: 'dragon',
    type: 'choice',
    prompt: 'Would you rather be a dragon or ride a dragon?',
    options: ['Be a dragon', 'Ride a dragon'],
  },
  {
    id: 'labMistake',
    type: 'longtext',
    prompt: 'Tell us about a time you made a mistake in the lab.',
    maxLength: 1000,
  },
  {
    id: 'plusOne',
    type: 'choice',
    prompt: 'Bringing a plus one?',
    options: ['Yes', 'No'],
  },
];

function isAsked(question, answers) {
  if (!question.showIf) return true;
  return Object.entries(question.showIf).every(([id, value]) => answers[id] === value);
}

// Returns an E.164 number like +16175551234, or null. Ten-digit numbers are
// assumed to be US; anything else needs a leading + and country code.
function normalizePhone(raw) {
  const value = String(raw || '').trim();
  const digits = value.replace(/\D/g, '');
  let phone;
  if (value.startsWith('+')) phone = '+' + digits;
  else if (digits.length === 10) phone = '+1' + digits;
  else if (digits.length === 11 && digits.startsWith('1')) phone = '+' + digits;
  else return null;
  return /^\+\d{8,15}$/.test(phone) ? phone : null;
}

// Invites created without a code (test invites) accept any password.
function isCorrectPassword(invite, value) {
  return !invite.code || normalizeCode(value) === invite.code;
}

// Returns { answers } with only the expected, cleaned fields, or { error }.
function validateAnswers(raw, invite) {
  if (!raw || typeof raw !== 'object') return { error: 'answers are required' };

  const answers = {};
  for (const q of QUESTIONS) {
    if (!isAsked(q, answers)) continue;

    const value = typeof raw[q.id] === 'string' ? raw[q.id].trim() : '';
    if (!value) return { error: `Missing answer: ${q.id}` };

    if (q.type === 'password') {
      if (!isCorrectPassword(invite, value)) return { error: 'Wrong password' };
      continue;
    }
    if (q.type === 'phone') {
      const phone = normalizePhone(value);
      if (!phone) return { error: 'Invalid phone number' };
      answers[q.id] = phone;
      continue;
    }
    if (q.type === 'choice' && !q.options.includes(value)) {
      return { error: `Invalid answer: ${q.id}` };
    }
    if ((q.type === 'text' || q.type === 'longtext') && value.length > q.maxLength) {
      return { error: `Answer too long: ${q.id}` };
    }
    answers[q.id] = value;
  }
  return { answers };
}

module.exports = { QUESTIONS, validateAnswers, normalizePhone, isCorrectPassword };
