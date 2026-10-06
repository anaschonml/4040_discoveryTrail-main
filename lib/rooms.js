// Speakeasy room details. Only the guest's assigned room is ever sent to the browser.
// TODO: replace placeholder details before the event.
const ROOMS = {
  room1: {
    id: 'room1',
    name: 'Room 1',
    date: 'Thursday, October 23',
    time: '8:00 PM',
    location: 'TBD',
    instructions: 'TBD: how to find the door and what to say.',
  },
  room2: {
    id: 'room2',
    name: 'Room 2',
    date: 'Thursday, October 23',
    time: '8:00 PM',
    location: 'TBD',
    instructions: 'TBD: how to find the door and what to say.',
  },
  room3: {
    id: 'room3',
    name: 'Room 3',
    date: 'Thursday, October 23',
    time: '8:00 PM',
    location: 'TBD',
    instructions: 'TBD: how to find the door and what to say.',
  },
  room4: {
    id: 'room4',
    name: 'Room 4',
    date: 'Thursday, October 23',
    time: '8:00 PM',
    location: 'TBD',
    instructions: 'TBD: how to find the door and what to say.',
  },
};

const ROOM_IDS = Object.keys(ROOMS);

function getRoom(id) {
  return ROOMS[id] || null;
}

module.exports = { ROOMS, ROOM_IDS, getRoom };
