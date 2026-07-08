const { db, FieldValue } = require('./admin');
const { nowIso } = require('../utils/date');

async function findPlayersByDiscordId(discordId) {
  const snap = await db.collection('players').where('discordId', '==', discordId).get();
  return snap.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
}

async function findPlayerByDocId(docId) {
  const doc = await db.collection('players').doc(docId).get();
  if (!doc.exists) return null;
  return { docId: doc.id, ...doc.data() };
}

async function isDuplicateUid(uid) {
  if (!uid) return false;
  const snap = await db.collection('players').where('uid', '==', String(uid)).limit(1).get();
  return !snap.empty;
}

async function isDuplicateName(name) {
  if (!name) return false;
  const snap = await db.collection('players').where('name', '==', name).limit(1).get();
  if (!snap.empty) return true;

  const oldSnap = await db.collection('players').where('characterName', '==', name).limit(1).get();
  return !oldSnap.empty;
}

async function hasPendingRegisterUid(uid) {
  if (!uid) return false;
  const snap = await db.collection('requests')
    .where('type', '==', 'register')
    .where('status', '==', 'pending')
    .where('uid', '==', String(uid))
    .limit(1)
    .get();

  return !snap.empty;
}

async function hasPendingRegisterName(name) {
  if (!name) return false;
  const snap1 = await db.collection('requests')
    .where('type', '==', 'register')
    .where('status', '==', 'pending')
    .where('name', '==', name)
    .limit(1)
    .get();

  if (!snap1.empty) return true;

  const snap2 = await db.collection('requests')
    .where('type', '==', 'register')
    .where('status', '==', 'pending')
    .where('characterName', '==', name)
    .limit(1)
    .get();

  return !snap2.empty;
}

async function hasPendingPlayerRequest(type, playerDocId) {
  if (!type || !playerDocId) return false;

  const snap = await db.collection('requests')
    .where('type', '==', type)
    .where('status', '==', 'pending')
    .where('playerDocId', '==', playerDocId)
    .limit(1)
    .get();

  return !snap.empty;
}

async function createRequest(data) {
  const ref = await db.collection('requests').add({
    ...data,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

async function getRequest(requestId) {
  const doc = await db.collection('requests').doc(requestId).get();
  if (!doc.exists) return null;
  return { requestId: doc.id, ...doc.data() };
}

async function updateRequest(requestId, data) {
  await db.collection('requests').doc(requestId).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function makePlayerDocRef() {
  let id = String(Date.now());
  let ref = db.collection('players').doc(id);
  let doc = await ref.get();

  while (doc.exists) {
    id = String(Date.now() + Math.floor(Math.random() * 1000));
    ref = db.collection('players').doc(id);
    doc = await ref.get();
  }

  return { id, ref };
}

async function createPlayerFromRequest(req, approvedBy) {
  const { id, ref } = await makePlayerDocRef();
  const powerValue = Number(req.power || 0);
  const timestamp = nowIso();

  const player = {
    absentCount: 0,

    discordDisplayName: req.discordDisplayName || '',
    discordId: req.discordId || '',
    discordLinked: Boolean(req.discordId),
    discordUsername: req.discordUsername || '',

    hasQuota: true,
    id,

    job: req.job || '',
    lastAttendanceStatus: '',
    lastAttendanceUpdatedAt: '',
    lastAttendanceWarId: '',

    leaveCount: 0,
    name: req.name || req.characterName || '',

    partyId: null,

    power: String(powerValue || ''),
    powerValue,

    presentCount: 0,

    rewardClaimed: false,
    rewardName: '',

    slotIndex: null,
    status: 'ยังไม่เช็คชื่อ',

    uid: String(req.uid || ''),
    updatedAt: timestamp,

    approvedBy,
    createdBy: 'discord-bot',
    sourceRequestId: req.requestId || req.id || '',
  };

  await ref.set(player);
  return id;
}

async function updatePlayer(docId, data, updatedBy) {
  const payload = { ...data };

  if (payload.power !== undefined) {
    const value = Number(String(payload.power).replace(/,/g, '')) || 0;
    payload.power = String(value || '');
    payload.powerValue = value;
  }

  await db.collection('players').doc(docId).update({
    ...payload,
    updatedAt: nowIso(),
    updatedBy,
  });
}

async function writeBotLog(data) {
  await db.collection('botLogs').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
}

module.exports = {
  findPlayersByDiscordId,
  findPlayerByDocId,
  isDuplicateUid,
  isDuplicateName,
  hasPendingRegisterUid,
  hasPendingRegisterName,
  hasPendingPlayerRequest,
  createRequest,
  getRequest,
  updateRequest,
  createPlayerFromRequest,
  updatePlayer,
  writeBotLog,
};
