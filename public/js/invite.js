const BOT_DELAY_MS = 600;

const token = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');
const introEl = document.getElementById('intro');
const conversationEl = document.getElementById('conversation');
const invitationEl = document.getElementById('invitation');
const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('chat-input');
const roomEl = document.getElementById('room');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showView(view) {
  for (const el of [introEl, conversationEl, invitationEl]) {
    el.hidden = el !== view;
  }
  window.scrollTo(0, 0);
}

function addBubble(text, from) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-' + from;
  bubble.textContent = text;
  chatEl.appendChild(bubble);
  bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function botSays(text) {
  await wait(BOT_DELAY_MS);
  addBubble(text, 'bot');
}

function isAsked(question, answers) {
  if (!question.showIf) return true;
  return Object.entries(question.showIf).every(([id, value]) => answers[id] === value);
}

async function api(path, body) {
  const res = await fetch(`/api/invite/${encodeURIComponent(token)}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function buildTextInput(question) {
  let field;
  if (question.type === 'longtext') {
    field = document.createElement('textarea');
    field.rows = 4;
  } else {
    field = document.createElement('input');
    field.type = question.type === 'phone' ? 'tel' : 'text';
    if (question.type === 'phone') field.autocomplete = 'tel';
    else field.autocomplete = 'off';
    if (question.type === 'password') field.autocapitalize = 'characters';
  }
  field.className = 'chat-text';
  if (question.maxLength) field.maxLength = question.maxLength;
  field.setAttribute('aria-label', question.prompt);
  return field;
}

// Shows the input for one question and resolves with what the guest entered.
function readAnswer(question) {
  return new Promise((resolve) => {
    inputEl.innerHTML = '';
    inputEl.hidden = false;
    inputEl.onsubmit = (e) => e.preventDefault();

    const finish = (value) => {
      inputEl.hidden = true;
      inputEl.innerHTML = '';
      addBubble(value, 'user');
      resolve(value);
    };

    if (question.type === 'choice') {
      for (const option of question.options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-choice';
        button.textContent = option;
        button.addEventListener('click', () => finish(option));
        inputEl.appendChild(button);
      }
      return;
    }

    const field = buildTextInput(question);
    const send = document.createElement('button');
    send.type = 'submit';
    send.className = 'chat-send';
    send.textContent = 'Send';

    inputEl.append(field, send);
    inputEl.onsubmit = (e) => {
      e.preventDefault();
      const value = field.value.trim();
      if (value) finish(value);
    };
    field.focus();
  });
}

// Password and phone answers are checked by the server before moving on.
async function ask(question) {
  await botSays(question.prompt);
  for (;;) {
    const value = await readAnswer(question);
    if (question.type !== 'password' && question.type !== 'phone') return value;

    try {
      const { ok } = await api('/check', { questionId: question.id, value });
      if (ok) return value;
      await botSays(question.wrongReply || question.invalidReply);
    } catch (err) {
      await botSays(err.message);
    }
  }
}

function showInvitation(room) {
  roomEl.innerHTML = '';
  const rows = [
    ['When', `${room.date}, ${room.time}`],
    ['Where', room.location],
    ['Getting in', room.instructions],
  ];

  const title = document.createElement('h2');
  title.textContent = room.name;
  roomEl.appendChild(title);

  const list = document.createElement('dl');
  for (const [label, value] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }
  roomEl.appendChild(list);

  const note = document.createElement('p');
  note.className = 'invitation-note';
  note.textContent = "We've texted you these details too.";
  roomEl.appendChild(note);

  showView(invitationEl);
}

async function runChat(questions) {
  showView(conversationEl);

  const answers = {};
  for (const question of questions) {
    if (!isAsked(question, answers)) continue;
    answers[question.id] = await ask(question);
  }

  await botSays('One moment while we find your door…');
  for (;;) {
    try {
      const result = await api('/rsvp', { answers });
      await wait(BOT_DELAY_MS * 2);
      showInvitation(result.room);
      return;
    } catch (err) {
      await botSays(err.message);
      await readAnswer({ type: 'choice', options: ['Try again'] });
    }
  }
}

function runIntro() {
  showView(introEl);
  return new Promise((resolve) => {
    document.getElementById('intro-next').addEventListener('click', resolve, { once: true });
  });
}

function showError(message) {
  showView(conversationEl);
  addBubble(message, 'bot');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`/api/invite/${encodeURIComponent(token)}`);
    if (res.status === 404) {
      showError("This invitation doesn't exist. Check the link in your text.");
      return;
    }
    if (!res.ok) throw new Error();
    const invite = await res.json();

    if (invite.status === 'submitted') {
      showInvitation(invite.room);
      return;
    }
    await runIntro();
    await runChat(invite.questions);
  } catch (err) {
    console.error(err);
    showError('Something went wrong loading your invitation. Please refresh the page.');
  }
});
