const { env } = require('../config/env');
const repo = require('../firebase/repositories');
const { sendAdminRequest } = require('./adminNotifyService');
const { adminResolvedCard } = require('../ui/components');

async function submitRequest(guild, req) {
  const requestId = await repo.createRequest(req);

  await sendAdminRequest(guild, requestId, req);

  await repo.writeBotLog({
    action: `request.${req.type}.created`,
    requestId,
    discordId: req.discordId,
    name: req.name || req.characterName || null,
  });

  return requestId;
}

function typeName(type) {
  return {
    register: 'สมัครสมาชิก / เพิ่มตัวละคร',
    rename: 'เปลี่ยนชื่อตัวละคร',
    changeJob: 'เปลี่ยนอาชีพ',
  }[type] || type;
}

async function notifyUser(interaction, req, status, detail) {
  try {
    const user = await interaction.client.users.fetch(req.discordId);
    const emoji = status === 'approved' ? '✅' : '❌';
    await user.send([
      `${emoji} ผลคำขอ BELLONA: **${typeName(req.type)}**`,
      '',
      detail,
    ].join('\n'));
    return true;
  } catch (_) {
    return false;
  }
}

async function cleanupAdminCard(interaction, text, color, shouldDelete = true) {
  try {
    const original = interaction.message?.embeds?.[0];
    if (original) {
      await interaction.message.edit(adminResolvedCard(original, text, color));
    } else {
      await interaction.message.edit({ components: [] });
    }

    if (shouldDelete) {
      setTimeout(() => {
        interaction.message.delete().catch(() => {});
      }, 5000);
    }
  } catch (_) {}
}

async function approveRequest(interaction, requestId) {
  const req = await repo.getRequest(requestId);

  if (!req) {
    await cleanupAdminCard(interaction, 'Request not found', 0x828282);
    return interaction.editReply({ content: 'ไม่พบคำขอนี้' });
  }

  if (req.status !== 'pending') {
    await cleanupAdminCard(interaction, `Already handled: ${req.status}`, 0x828282);
    return interaction.editReply({ content: `คำขอนี้ถูกจัดการแล้ว: ${req.status}` });
  }

  if (req.type === 'register') {
    if (await repo.isDuplicateUid(req.uid)) {
      await repo.updateRequest(requestId, { status: 'rejected', rejectReason: 'duplicate uid', reviewedBy: interaction.user.id });
      await notifyUser(interaction, req, 'rejected', `คำขอของ **${req.name || req.characterName}** ถูกปฏิเสธ เพราะ UID ซ้ำในระบบ`);
      await cleanupAdminCard(interaction, `Rejected by ${interaction.user.tag}: UID ซ้ำ`, 0xeb5757);
      return interaction.editReply({ content: '❌ ปฏิเสธอัตโนมัติ เพราะ UID ซ้ำในระบบ' });
    }

    if (await repo.isDuplicateName(req.name || req.characterName)) {
      await repo.updateRequest(requestId, { status: 'rejected', rejectReason: 'duplicate name', reviewedBy: interaction.user.id });
      await notifyUser(interaction, req, 'rejected', `คำขอของ **${req.name || req.characterName}** ถูกปฏิเสธ เพราะชื่อตัวละครซ้ำในระบบ`);
      await cleanupAdminCard(interaction, `Rejected by ${interaction.user.tag}: ชื่อซ้ำ`, 0xeb5757);
      return interaction.editReply({ content: '❌ ปฏิเสธอัตโนมัติ เพราะชื่อตัวละครซ้ำในระบบ' });
    }

    const playerId = await repo.createPlayerFromRequest({ ...req, requestId }, interaction.user.id);
    await repo.updateRequest(requestId, { status: 'approved', playerId, reviewedBy: interaction.user.id });

    try {
      const member = await interaction.guild.members.fetch(req.discordId);
      if (env.guestRoleId) await member.roles.remove(env.guestRoleId).catch(() => {});
      if (env.memberRoleId) await member.roles.add(env.memberRoleId).catch(() => {});
    } catch (_) {}

    await repo.writeBotLog({ action: 'request.register.approved', requestId, playerId, reviewedBy: interaction.user.id });
    await notifyUser(interaction, req, 'approved', `ตัวละคร **${req.name || req.characterName}** ได้รับการอนุมัติและเพิ่มเข้าเว็บเรียบร้อยแล้ว`);
    await cleanupAdminCard(interaction, `Approved by ${interaction.user.tag}`, 0x27ae60);
    return interaction.editReply({ content: `✅ อนุมัติแล้ว เพิ่ม **${req.name || req.characterName}** เข้า players` });
  }

  if (req.type === 'rename') {
    if (await repo.isDuplicateName(req.newName)) {
      await repo.updateRequest(requestId, { status: 'rejected', rejectReason: 'duplicate newName', reviewedBy: interaction.user.id });
      await notifyUser(interaction, req, 'rejected', `คำขอเปลี่ยนชื่อเป็น **${req.newName}** ถูกปฏิเสธ เพราะชื่อใหม่นี้มีในระบบแล้ว`);
      await cleanupAdminCard(interaction, `Rejected by ${interaction.user.tag}: ชื่อใหม่ซ้ำ`, 0xeb5757);
      return interaction.editReply({ content: '❌ ปฏิเสธอัตโนมัติ เพราะชื่อใหม่นี้มีในระบบแล้ว' });
    }

    await repo.updatePlayer(req.playerDocId, { name: req.newName }, interaction.user.id);
    await repo.updateRequest(requestId, { status: 'approved', reviewedBy: interaction.user.id });
    await repo.writeBotLog({ action: 'request.rename.approved', requestId, playerDocId: req.playerDocId, reviewedBy: interaction.user.id });
    await notifyUser(interaction, req, 'approved', `คำขอเปลี่ยนชื่อ **${req.oldName}** → **${req.newName}** ได้รับการอนุมัติแล้ว`);
    await cleanupAdminCard(interaction, `Approved by ${interaction.user.tag}`, 0x27ae60);
    return interaction.editReply({ content: `✅ อนุมัติแล้ว เปลี่ยนชื่อเป็น **${req.newName}**` });
  }

  if (req.type === 'changeJob') {
    await repo.updatePlayer(req.playerDocId, { job: req.newJob }, interaction.user.id);
    await repo.updateRequest(requestId, { status: 'approved', reviewedBy: interaction.user.id });
    await repo.writeBotLog({ action: 'request.changeJob.approved', requestId, playerDocId: req.playerDocId, reviewedBy: interaction.user.id });
    await notifyUser(interaction, req, 'approved', `คำขอเปลี่ยนอาชีพ **${req.name || '-'}** จาก **${req.oldJob || '-'}** เป็น **${req.newJob}** ได้รับการอนุมัติแล้ว`);
    await cleanupAdminCard(interaction, `Approved by ${interaction.user.tag}`, 0x27ae60);
    return interaction.editReply({ content: `✅ อนุมัติแล้ว เปลี่ยนอาชีพเป็น **${req.newJob}**` });
  }

  return interaction.editReply({ content: 'คำขอประเภทนี้ยังไม่รองรับ' });
}

async function rejectRequest(interaction, requestId) {
  const req = await repo.getRequest(requestId);
  if (!req) {
    await cleanupAdminCard(interaction, 'Request not found', 0x828282);
    return interaction.editReply({ content: 'ไม่พบคำขอนี้' });
  }

  if (req.status !== 'pending') {
    await cleanupAdminCard(interaction, `Already handled: ${req.status}`, 0x828282);
    return interaction.editReply({ content: `คำขอนี้ถูกจัดการแล้ว: ${req.status}` });
  }

  await repo.updateRequest(requestId, { status: 'rejected', reviewedBy: interaction.user.id });
  await repo.writeBotLog({ action: `request.${req.type}.rejected`, requestId, reviewedBy: interaction.user.id });

  const label = req.name || req.characterName || req.oldName || req.newName || '';
  await notifyUser(interaction, req, 'rejected', `คำขอ **${typeName(req.type)}** ${label ? `ของ **${label}** ` : ''}ถูกปฏิเสธโดย Admin`);
  await cleanupAdminCard(interaction, `Rejected by ${interaction.user.tag}`, 0xeb5757);

  return interaction.editReply({ content: '❌ ปฏิเสธคำขอแล้ว' });
}

module.exports = { submitRequest, approveRequest, rejectRequest };
