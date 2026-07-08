const express = require('express');
const { env } = require('../config/env');
const { logger } = require('../logger/logger');

function startHealthServer() {
  const app = express();

  app.get('/', (_, res) => res.send('BELLONA Discord Bot Production v3.1.2 is running'));
  app.get('/health', (_, res) => res.json({
    ok: true,
    service: 'bellona-discord-bot',
    version: '3.1.2',
    uptimeSeconds: Math.floor(process.uptime())
  }));

  app.listen(env.port, () => logger.info(`Health server started on port ${env.port}`));
}

module.exports = { startHealthServer };
