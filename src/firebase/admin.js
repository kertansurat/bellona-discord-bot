const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { findFirebaseSecretFile } = require('./secretFile');
const { logger } = require('../logger/logger');

const serviceAccountPath = findFirebaseSecretFile();
const resolvedServiceAccountPath = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.resolve(process.cwd(), serviceAccountPath);

logger.info('Using resolved Firebase secret file', {
  path: resolvedServiceAccountPath,
});

const serviceAccount = JSON.parse(
  fs.readFileSync(resolvedServiceAccountPath, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

logger.info('Firebase Admin SDK initialized', {
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = { db, FieldValue };