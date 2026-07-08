const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { registerPanel, changePanel } = require('../ui/components');

function botCanSendPanel(interaction) {
  const perms = interaction.channel.permissionsFor(interaction.guild.members.me);
  return perms &&
    perms.has(PermissionFlagsBits.ViewChannel) &&
    perms.has(PermissionFlagsBits.SendMessages) &&
    perms.has(PermissionFlagsBits.EmbedLinks);
}

async function handleCommand(interaction) {
  if (interaction.commandName === 'setup-register-panel') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.editReply({ content: 'คุณไม่มีสิทธิ์ติดตั้ง Panel' });
    }

    if (!botCanSendPanel(interaction)) {
      return interaction.editReply({ content: 'บอทไม่มีสิทธิ์ส่ง Panel ในห้องนี้ ต้องเปิด View Channel, Send Messages, Embed Links' });
    }

    await interaction.channel.send(registerPanel());
    return interaction.editReply({ content: '✅ ติดตั้ง Register Panel แล้ว' });
  }

  if (interaction.commandName === 'setup-change-panel') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.editReply({ content: 'คุณไม่มีสิทธิ์ติดตั้ง Panel' });
    }

    if (!botCanSendPanel(interaction)) {
      return interaction.editReply({ content: 'บอทไม่มีสิทธิ์ส่ง Panel ในห้องนี้ ต้องเปิด View Channel, Send Messages, Embed Links' });
    }

    await interaction.channel.send(changePanel());
    return interaction.editReply({ content: '✅ ติดตั้ง Change Request Panel แล้ว' });
  }
}

module.exports = { handleCommand };
