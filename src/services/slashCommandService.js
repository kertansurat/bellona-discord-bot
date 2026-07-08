const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { env } = require('../config/env');
const { logger } = require('../logger/logger');

const commands = [
  new SlashCommandBuilder()
    .setName('setup-register-panel')
    .setDescription('ติดตั้ง Register Panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName('setup-change-panel')
    .setDescription('ติดตั้ง Change Request Panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map(command => command.toJSON());

async function deploySlashCommands() {
  const rest = new REST({ version: '10' }).setToken(env.discordToken);
  await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), { body: commands });
  logger.info('Slash commands deployed');
}

module.exports = { deploySlashCommands };
