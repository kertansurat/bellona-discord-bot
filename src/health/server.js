const express = require('express');
const { env } = require('../config/env');
const { logger } = require('../logger/logger');
const { getStatus } = require('../state/runtimeStatus');

function startHealthServer(client) {
  const app = express();

  app.get('/', (_, res) => {
    const status = getStatus(client);
    res.status(status.discord.ready ? 200 : 503).json({
      service: 'BELLONA Discord Bot',
      version: '3.2.1',
      status: status.discord.ready ? 'ok' : 'degraded',
      discord: status.discord,
      uptimeSeconds: status.uptimeSeconds,
    });
  });

  app.get('/health', (_, res) => {
    const status = getStatus(client);
    res.status(status.discord.ready ? 200 : 503).json({
      ok: status.discord.ready,
      service: 'bellona-discord-bot',
      version: '3.2.1',
      uptimeSeconds: status.uptimeSeconds,
      discord: status.discord,
    });
  });

  app.listen(env.port, () => logger.info(`Health server started on port ${env.port}`));
}

module.exports = { startHealthServer };
