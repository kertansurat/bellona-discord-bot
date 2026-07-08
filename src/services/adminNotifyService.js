const { PermissionFlagsBits } = require('discord.js');
const { env } = require('../config/env');
const { adminRequestCard } = require('../ui/components');

async function sendAdminRequest(guild, requestId, req) {
  const channel = await guild.channels.fetch(env.adminChannelId).catch(() => null);
  if (!channel) {
    throw new Error(`หา ADMIN_CHANNEL_ID ไม่เจอ: ${env.adminChannelId}`);
  }

  const perms = channel.permissionsFor(guild.members.me);
  if (!perms ||
      !perms.has(PermissionFlagsBits.ViewChannel) ||
      !perms.has(PermissionFlagsBits.SendMessages) ||
      !perms.has(PermissionFlagsBits.EmbedLinks)) {
    throw new Error('บอทไม่มีสิทธิ์ส่งข้อความในห้อง admin-bot');
  }

  await channel.send(adminRequestCard(requestId, req));
}

module.exports = { sendAdminRequest };
