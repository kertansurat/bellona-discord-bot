const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

const repo = require('../firebase/repositories');
const session = require('../state/sessionStore');
const { jobSelect } = require('../ui/components');
const { submitRequest } = require('../services/requestService');

async function handleSelectMenu(interaction) {
  if (interaction.customId === 'select.register.job' || interaction.customId === 'select:register_job') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const draft = session.get(interaction.user.id, 'registerDraft');
    if (!draft) return interaction.editReply({ content: 'Session หมดอายุ กรุณากดสมัครใหม่' });

    if (await repo.hasPendingRegisterUid(draft.uid)) {
      session.clear(interaction.user.id, 'registerDraft');
      return interaction.editReply({ content: 'UID นี้มีคำขอสมัครที่รอ Admin อนุมัติอยู่แล้ว' });
    }

    if (await repo.hasPendingRegisterName(draft.name)) {
      session.clear(interaction.user.id, 'registerDraft');
      return interaction.editReply({ content: 'ชื่อตัวละครนี้มีคำขอสมัครที่รอ Admin อนุมัติอยู่แล้ว' });
    }

    const requestId = await submitRequest(interaction.guild, {
      type: 'register',
      discordId: interaction.user.id,
      discordUsername: interaction.user.tag,
      discordDisplayName: interaction.member?.displayName || interaction.user.username,
      uid: draft.uid,
      name: draft.name,
      power: draft.power,
      job: interaction.values[0],
    });

    session.clear(interaction.user.id, 'registerDraft');

    return interaction.editReply({
      content: [
        '✅ ส่งคำขอสมัครแล้ว',
        '',
        `ชื่อตัวละคร: **${draft.name}**`,
        `อาชีพ: **${interaction.values[0]}**`,
        `POWER: **${draft.power}**`,
        '',
        'รอ Admin อนุมัติ',
      ].join('\n'),
    });
  }

  if (interaction.customId === 'select.rename.player' || interaction.customId === 'select:rename_player') {
    session.set(interaction.user.id, 'renamePlayerDocId', interaction.values[0]);

    const modal = new ModalBuilder()
      .setCustomId('modal.rename')
      .setTitle('ขอเปลี่ยนชื่อตัวละคร');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('newName')
          .setLabel('ชื่อใหม่')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.customId === 'select.job.player' || interaction.customId === 'select:job_player') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    session.set(interaction.user.id, 'jobPlayerDocId', interaction.values[0]);

    return interaction.editReply({
      content: 'เลือกอาชีพใหม่',
      components: [jobSelect('select.job.new')],
    });
  }

  if (interaction.customId === 'select.job.new' || interaction.customId === 'select:new_job') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const playerDocId = session.get(interaction.user.id, 'jobPlayerDocId');
    if (!playerDocId) return interaction.editReply({ content: 'Session หมดอายุ กรุณากดขอเปลี่ยนอาชีพใหม่' });

    const player = await repo.findPlayerByDocId(playerDocId);
    if (!player) return interaction.editReply({ content: 'ไม่พบตัวละครนี้แล้ว' });

    if (await repo.hasPendingPlayerRequest('changeJob', playerDocId)) {
      return interaction.editReply({ content: 'ตัวละครนี้มีคำขอเปลี่ยนอาชีพที่รอ Admin อนุมัติอยู่แล้ว' });
    }

    const requestId = await submitRequest(interaction.guild, {
      type: 'changeJob',
      discordId: interaction.user.id,
      discordUsername: interaction.user.tag,
      discordDisplayName: interaction.member?.displayName || interaction.user.username,
      playerDocId,
      name: player.name || player.characterName || '',
      oldJob: player.job || '',
      newJob: interaction.values[0],
    });

    session.clear(interaction.user.id, 'jobPlayerDocId');

    return interaction.editReply({
      content: [
        '✅ ส่งคำขอเปลี่ยนอาชีพแล้ว',
        '',
        `ชื่อตัวละคร: **${player.name || player.characterName || '-'}**`,
        `อาชีพใหม่: **${interaction.values[0]}**`,
        '',
        'รอ Admin อนุมัติ',
      ].join('\n'),
    });
  }
}

module.exports = { handleSelectMenu };
