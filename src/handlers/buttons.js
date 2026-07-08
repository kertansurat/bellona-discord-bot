const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

const repo = require('../firebase/repositories');
const { playerSelect, profileEmbed } = require('../ui/components');
const { approveRequest, rejectRequest } = require('../services/requestService');

function isOneOf(value, list) {
  return list.includes(value);
}

async function handleButton(interaction) {
  const id = interaction.customId;

  // v3: member.register.start
  // v2 legacy: register:start
  if (isOneOf(id, ['member.register.start', 'register:start'])) {
    const modal = new ModalBuilder()
      .setCustomId('modal.register')
      .setTitle('เพิ่มสมาชิก / เพิ่มตัวละคร');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('uid')
          .setLabel('UID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('ชื่อตัวละคร')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('power')
          .setLabel('POWER')
          .setPlaceholder('เช่น 350000')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (isOneOf(id, ['member.profile.view', 'profile:view'])) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const players = await repo.findPlayersByDiscordId(interaction.user.id);
    if (!players.length) return interaction.editReply({ content: 'ยังไม่พบข้อมูลของคุณในระบบ' });

    return interaction.editReply({ embeds: [profileEmbed(players)] });
  }

  if (isOneOf(id, ['member.rename.start', 'rename:start'])) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const players = await repo.findPlayersByDiscordId(interaction.user.id);
    if (!players.length) return interaction.editReply({ content: 'ยังไม่มีตัวละครในระบบ ต้องสมัครและได้รับอนุมัติก่อน' });

    return interaction.editReply({
      content: 'เลือกตัวละครที่ต้องการเปลี่ยนชื่อ',
      components: [playerSelect('select.rename.player', players, 'เลือกตัวละคร')],
    });
  }

  if (isOneOf(id, ['member.job.start', 'jobchange:start'])) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const players = await repo.findPlayersByDiscordId(interaction.user.id);
    if (!players.length) return interaction.editReply({ content: 'ยังไม่มีตัวละครในระบบ ต้องสมัครและได้รับอนุมัติก่อน' });

    return interaction.editReply({
      content: 'เลือกตัวละครที่ต้องการเปลี่ยนอาชีพ',
      components: [playerSelect('select.job.player', players, 'เลือกตัวละคร')],
    });
  }

  if (id.startsWith('admin.approve.') || id.startsWith('admin:approve:')) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const requestId = id.startsWith('admin.approve.')
      ? id.replace('admin.approve.', '')
      : id.split(':')[2];
    return approveRequest(interaction, requestId);
  }

  if (id.startsWith('admin.reject.') || id.startsWith('admin:reject:')) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const requestId = id.startsWith('admin.reject.')
      ? id.replace('admin.reject.', '')
      : id.split(':')[2];
    return rejectRequest(interaction, requestId);
  }

  return interaction.reply({
    content: 'ปุ่มนี้เป็น Panel เวอร์ชันเก่าหรือไม่รองรับแล้ว กรุณาให้ Admin สร้าง Panel ใหม่ด้วย /setup-register-panel หรือ /setup-change-panel',
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = { handleButton };
