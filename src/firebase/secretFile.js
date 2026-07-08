const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');
const { logger } = require('../logger/logger');

function findFirebaseSecretFile() {
  if (env.firebaseServiceAccountPath && fs.existsSync(env.firebaseServiceAccountPath)) {
    logger.info('Using Firebase secret file from env path', { path: env.firebaseServiceAccountPath });
    return env.firebaseServiceAccountPath;
  }

  const secretDir = '/etc/secrets';
  if (fs.existsSync(secretDir)) {
    const files = fs.readdirSync(secretDir)
      .filter(name => name.toLowerCase().endsWith('.json'))
      .map(name => path.join(secretDir, name));

    if (files.length > 0) {
      logger.info('Auto detected Firebase secret file', { path: files[0] });
      return files[0];
    }
  }

  const localCandidates = [
    path.join(process.cwd(), 'firebase-admin.json'),
    path.join(process.cwd(), 'serviceAccountKey.json'),
  ];

  for (const file of localCandidates) {
    if (fs.existsSync(file)) return file;
  }

  throw new Error('Firebase service account JSON not found. Add Render Secret File ending with .json.');
}

module.exports = { findFirebaseSecretFile };
