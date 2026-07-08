const sessions = new Map();

function set(userId, key, value) {
  const current = sessions.get(userId) || {};
  current[key] = value;
  sessions.set(userId, current);
}

function get(userId, key) {
  return (sessions.get(userId) || {})[key];
}

function clear(userId, key) {
  const current = sessions.get(userId) || {};
  delete current[key];
  sessions.set(userId, current);
}

module.exports = { set, get, clear };
