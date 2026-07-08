const { MessageFlags } = require('discord.js');
const { logger } = require('../logger/logger');
const repo = require('../firebase/repositories');

async function safeInteractionError(interaction, error) {
  logger.error('Interaction error', error);

  try {
    await repo.writeBotLog({
      action: 'error.interaction',
      customId: interaction.customId || null,
      commandName: interaction.commandName || null,
      userId: interaction.user?.id || null,
      errorMessage: error.message,
      errorStack: error.stack,
    });
  } catch (_) {}

  const content = `❌ บอทเกิดข้อผิดพลาด: ${error.message}`;

  try {
    if (interaction.deferred && !interaction.replied) {
      return interaction.editReply({ content });
    }

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({ content, flags: MessageFlags.Ephemeral });
  } catch (_) {}
}

module.exports = { safeInteractionError };
