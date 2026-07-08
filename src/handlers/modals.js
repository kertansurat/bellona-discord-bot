const { MessageFlags } = require('discord.js');

const repo = require('../firebase/repositories');
const session = require('../state/sessionStore');
const { jobSelect } = require('../ui/components');
const { submitRequest } = require('../services/requestService');
const { cleanText, parsePower } = require('../utils/validators');

async function handleModal(interaction) {
  if (interaction.customId === 'modal.register' || interaction.customId === 'modal:register') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const uid = cleanText(interaction.fields.getTextInputValue('uid'));
    let name = '';
    try {
      name = cleanText(interaction.fields.getTextInputValue('name'));
    } catch (_) {
      name = cleanText(interaction.fields.getTextInputValue('characterName'));
    }
    const power = parsePower(interaction.fields.getTextInputValue('power'));

    if (await repo.isDuplicateUid(uid)) {
      return interaction.editReply({ content: 'UID นี้มีอยู่ในระบบแล้ว กรุณาติดต่อ Admin' });
    }

    if (await repo.hasPendingRegisterUid(uid)) {
      return interaction.editReply({ content: 'UID นี้มีคำขอสมัครที่รอ Admin อนุมัติอยู่แล้ว' });
    }

    if (await repo.isDuplicateName(name)) {
      return interaction.editReply({ content: 'ชื่อตัวละครนี้มีอยู่ในระบบแล้ว กรุณาติดต่อ Admin' });
    }

    if (await repo.hasPendingRegisterName(name)) {
      return interaction.editReply({ content: 'ชื่อตัวละครนี้มีคำขอสมัครที่รอ Admin อนุมัติอยู่แล้ว' });
    }

    session.set(interaction.user.id, 'registerDraft', { uid, name, power });

    return interaction.editReply({
      content: `เลือกอาชีพของ **${name}**`,
      components: [jobSelect('select.register.job')],
    });
  }

  if (interaction.customId === 'modal.rename' || interaction.customId === 'modal:rename') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const playerDocId = session.get(interaction.user.id, 'renamePlayerDocId');
    if (!playerDocId) return interaction.editReply({ content: 'Session หมดอายุ กรุณากดขอเปลี่ยนชื่อใหม่' });

    const newName = cleanText(interaction.fields.getTextInputValue('newName'));
    const player = await repo.findPlayerByDocId(playerDocId);
    if (!player) return interaction.editReply({ content: 'ไม่พบตัวละครนี้แล้ว' });

    if (await repo.hasPendingPlayerRequest('rename', playerDocId)) {
      return interaction.editReply({ content: 'ตัวละครนี้มีคำขอเปลี่ยนชื่อที่รอ Admin อนุมัติอยู่แล้ว' });
    }

    const requestId = await submitRequest(interaction.guild, {
      type: 'rename',
      discordId: interaction.user.id,
      discordUsername: interaction.user.tag,
      discordDisplayName: interaction.member?.displayName || interaction.user.username,
      playerDocId,
      oldName: player.name || player.characterName || '',
      newName,
    });

    session.clear(interaction.user.id, 'renamePlayerDocId');

    return interaction.editReply({ content: `✅ ส่งคำขอเปลี่ยนชื่อแล้ว รอ Admin อนุมัติ` });
  }
}

module.exports = { handleModal };
