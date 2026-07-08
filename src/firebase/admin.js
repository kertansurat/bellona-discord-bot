const admin = require('firebase-admin');
const { findFirebaseSecretFile } = require('./secretFile');
const { logger } = require('../logger/logger');

const serviceAccountPath = findFirebaseSecretFile();
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

logger.info('Firebase Admin SDK initialized', { projectId: serviceAccount.project_id });

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = { db, FieldValue };
