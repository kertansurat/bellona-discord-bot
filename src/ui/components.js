const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');

const { JOBS } = require('../config/jobs');

function jobSelect(customId, placeholder = 'เลือกอาชีพ') {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(JOBS.map(job => ({ label: job, value: job })))
  );
}

function playerSelect(customId, players, placeholder) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(players.slice(0, 25).map(player => ({
        label: player.name || player.characterName || 'ไม่ระบุชื่อ',
        description: `${player.job || '-'} | POWER ${player.powerValue ?? player.power ?? '-'}`,
        value: player.docId,
      })))
  );
}

function registerPanel() {
  const embed = new EmbedBuilder()
    .setTitle('BELLONA REGISTER SYSTEM')
    .setColor(0xf2c94c)
    .setDescription([
      'สมัครสมาชิก / เพิ่มตัวละครใหม่เข้าระบบกิลด์',
      '',
      'รองรับ 1 Discord มีหลายตัวละคร',
      '',
      'ข้อมูลที่ต้องกรอก:',
      'UID / ชื่อตัวละคร / อาชีพ / POWER',
      '',
      'ข้อมูลจะยังไม่ขึ้นหน้าเว็บจนกว่า Admin จะอนุมัติ',
    ].join('\n'));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('member.register.start')
      .setLabel('➕ เพิ่มสมาชิก / เพิ่มตัวละคร')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('member.profile.view')
      .setLabel('👤 โปรไฟล์ของฉัน')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

function changePanel() {
  const embed = new EmbedBuilder()
    .setTitle('BELLONA CHANGE REQUEST')
    .setColor(0x2f80ed)
    .setDescription([
      'แจ้งเปลี่ยนข้อมูลตัวละคร',
      '',
      'ระบบจะให้เลือกตัวละครก่อนเปลี่ยนชื่อหรืออาชีพ',
      'ทุกคำขอต้องรอ Admin อนุมัติก่อน',
    ].join('\n'));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('member.rename.start')
      .setLabel('✏️ ขอเปลี่ยนชื่อตัวละคร')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('member.job.start')
      .setLabel('🛡 ขอเปลี่ยนอาชีพ')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('member.profile.view')
      .setLabel('👤 โปรไฟล์ของฉัน')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

function profileEmbed(players) {
  const description = players.map((player, index) => [
    `**ตัวละคร ${index + 1}: ${player.name || player.characterName || '-'}**`,
    `UID: ${player.uid || '-'}`,
    `อาชีพ: ${player.job || '-'}`,
    `POWER: ${player.powerValue ?? player.power ?? '-'}`,
  ].join('\n')).join('\n\n');

  return new EmbedBuilder()
    .setTitle('👤 โปรไฟล์ของฉัน')
    .setColor(0x27ae60)
    .setDescription(description || 'ยังไม่มีข้อมูล');
}

function adminRequestCard(requestId, req) {
  const typeName = {
    register: 'เพิ่มสมาชิก / เพิ่มตัวละคร',
    rename: 'เปลี่ยนชื่อ',
    changeJob: 'เปลี่ยนอาชีพ',
  }[req.type] || req.type;

  const fields = [
    { name: 'ประเภท', value: typeName, inline: true },
    { name: 'Discord', value: `<@${req.discordId}>`, inline: true },
  ];

  if (req.uid) fields.push({ name: 'UID', value: String(req.uid), inline: true });
  if (req.name || req.characterName) fields.push({ name: 'ชื่อตัวละคร', value: String(req.name || req.characterName), inline: true });
  if (req.oldName) fields.push({ name: 'ชื่อเดิม', value: String(req.oldName), inline: true });
  if (req.newName) fields.push({ name: 'ชื่อใหม่', value: String(req.newName), inline: true });
  if (req.job) fields.push({ name: 'อาชีพ', value: String(req.job), inline: true });
  if (req.oldJob) fields.push({ name: 'อาชีพเดิม', value: String(req.oldJob), inline: true });
  if (req.newJob) fields.push({ name: 'อาชีพใหม่', value: String(req.newJob), inline: true });
  if (req.power !== undefined) fields.push({ name: 'POWER', value: String(req.power), inline: true });
  fields.push({ name: 'Request ID', value: requestId, inline: false });

  const embed = new EmbedBuilder()
    .setTitle('📥 คำขอรออนุมัติ')
    .setColor(0xeb5757)
    .addFields(fields)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`admin.approve.${requestId}`)
      .setLabel('✅ อนุมัติ')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`admin.reject.${requestId}`)
      .setLabel('❌ ปฏิเสธ')
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

function adminResolvedCard(originalEmbed, statusText, color) {
  const embed = EmbedBuilder.from(originalEmbed)
    .setColor(color)
    .setFooter({ text: statusText });

  return { embeds: [embed], components: [] };
}

module.exports = {
  jobSelect,
  playerSelect,
  registerPanel,
  changePanel,
  profileEmbed,
  adminRequestCard,
  adminResolvedCard,
};
