const { handleCommand } = require('../handlers/commands');
const { handleButton } = require('../handlers/buttons');
const { handleModal } = require('../handlers/modals');
const { handleSelectMenu } = require('../handlers/selectMenus');
const { safeInteractionError } = require('../handlers/errorHandler');

async function onInteractionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) return handleCommand(interaction);
    if (interaction.isButton()) return handleButton(interaction);
    if (interaction.isModalSubmit()) return handleModal(interaction);
    if (interaction.isStringSelectMenu()) return handleSelectMenu(interaction);
  } catch (error) {
    return safeInteractionError(interaction, error);
  }
}

module.exports = { onInteractionCreate };
