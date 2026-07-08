require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { env } = require('./config/env');
const { logger } = require('./logger/logger');
const { deploySlashCommands } = require('./services/slashCommandService');
const { onInteractionCreate } = require('./events/interactionCreate');
const { startHealthServer } = require('./health/server');

require('./firebase/admin');

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel],
  });

  // discord.js v14 ใช้ ready เป็นหลัก
  // clientReady เป็น event ของ v15 จึงทำให้ v3.1.1 ไม่เข้า callback
  client.once('ready', async () => {
    logger.info(`BELLONA Bot logged in as ${client.user.tag}`);

    try {
      await deploySlashCommands();
    } catch (error) {
      logger.error('Slash command deploy failed, bot keeps running', error);
    }
  });

  client.on('shardReconnecting', shardId => logger.warn('Discord shard reconnecting', { shardId }));
  client.on('shardResume', (shardId, replayedEvents) => logger.info('Discord shard resumed', { shardId, replayedEvents }));
  client.on('shardDisconnect', (event, shardId) => logger.warn('Discord shard disconnected', { shardId, code: event?.code, reason: event?.reason }));
  client.on('shardError', (error, shardId) => logger.error('Discord shard error', { shardId, message: error.message, stack: error.stack }));

  client.on('interactionCreate', onInteractionCreate);

  process.on('unhandledRejection', error => logger.error('Unhandled rejection', error));
  process.on('uncaughtException', error => logger.error('Uncaught exception', error));

  startHealthServer();
  await client.login(env.discordToken);
}

main().catch(error => {
  logger.error('Bot startup failed', error);
  process.exit(1);
});
