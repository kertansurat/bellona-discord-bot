require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { env } = require('./config/env');
const { logger } = require('./logger/logger');
const { deploySlashCommands } = require('./services/slashCommandService');
const { onInteractionCreate } = require('./events/interactionCreate');
const { startHealthServer } = require('./health/server');
const { updateDiscord } = require('./state/runtimeStatus');
const { startAutoRecovery } = require('./services/recoveryService');

require('./firebase/admin');

function attachGatewayDiagnostics(client) {
  client.once('clientReady', async () => {
    updateDiscord({
      state: 'ready',
      ready: true,
      lastReadyAt: new Date().toISOString(),
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });

    logger.info(`BELLONA Bot logged in as ${client.user.tag}`);

    try {
      await deploySlashCommands();
    } catch (error) {
      logger.error('Slash command deploy failed, bot keeps running', error);
    }
  });

  client.on('shardReady', shardId => {
    updateDiscord({
      state: 'ready',
      ready: client.isReady(),
      lastReadyAt: new Date().toISOString(),
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });
    logger.info('Discord shard ready', { shardId, wsStatus: client.ws.status, ping: client.ws.ping });
  });

  client.on('shardReconnecting', shardId => {
    updateDiscord({
      state: 'reconnecting',
      ready: false,
      lastReconnectAt: new Date().toISOString(),
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });
    logger.warn('Discord shard reconnecting', { shardId, wsStatus: client.ws.status, ping: client.ws.ping });
  });

  client.on('shardResume', (shardId, replayedEvents) => {
    updateDiscord({
      state: 'resumed',
      ready: client.isReady(),
      lastResumeAt: new Date().toISOString(),
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });
    logger.info('Discord shard resumed', { shardId, replayedEvents, wsStatus: client.ws.status, ping: client.ws.ping });
  });

  client.on('shardDisconnect', (event, shardId) => {
    updateDiscord({
      state: 'disconnected',
      ready: false,
      lastDisconnectAt: new Date().toISOString(),
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });
    logger.warn('Discord shard disconnected', {
      shardId,
      code: event?.code,
      reason: event?.reason,
      wasClean: event?.wasClean,
      wsStatus: client.ws.status,
    });
  });

  client.on('shardError', (error, shardId) => {
    updateDiscord({
      state: 'error',
      ready: false,
      lastErrorAt: new Date().toISOString(),
      lastErrorMessage: error.message,
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });
    logger.error('Discord shard error', { shardId, message: error.message, stack: error.stack });
  });

  client.on('error', error => {
    updateDiscord({
      state: 'client_error',
      lastErrorAt: new Date().toISOString(),
      lastErrorMessage: error.message,
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });
    logger.error('Discord client error', error);
  });

  client.on('warn', message => {
    logger.warn('Discord client warning', { message });
  });
}

function startDiscordMonitor(client) {
  setInterval(() => {
    const ready = client.isReady();

    updateDiscord({
      ready,
      state: ready ? 'ready' : 'not_ready',
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });

    logger.info('Discord health heartbeat', {
      ready,
      wsStatus: client.ws.status,
      ping: client.ws.ping,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }, 60000);
}

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel],
  });

  attachGatewayDiagnostics(client);
  client.on('interactionCreate', onInteractionCreate);

  process.on('unhandledRejection', error => logger.error('Unhandled rejection', error));
  process.on('uncaughtException', error => logger.error('Uncaught exception', error));

  startHealthServer(client);
  startDiscordMonitor(client);
  startAutoRecovery(client, env.discordToken);

  await client.login(env.discordToken);
}

main().catch(error => {
  logger.error('Bot startup failed', error);
  process.exit(1);
});
