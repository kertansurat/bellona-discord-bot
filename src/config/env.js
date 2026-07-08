function getRequired(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

function getOptional(name, fallback = '') {
  const value = process.env[name];
  return value ? String(value).trim() : fallback;
}

const env = {
  discordToken: getRequired('DISCORD_TOKEN'),
  clientId: getRequired('DISCORD_CLIENT_ID'),
  guildId: getRequired('DISCORD_GUILD_ID'),

  registerChannelId: getRequired('REGISTER_CHANNEL_ID'),
  changeChannelId: getRequired('CHANGE_CHANNEL_ID'),
  adminChannelId: getRequired('ADMIN_CHANNEL_ID'),

  memberRoleId: getOptional('MEMBER_ROLE_ID'),
  guestRoleId: getOptional('GUEST_ROLE_ID'),

  firebaseServiceAccountPath: getOptional('FIREBASE_SERVICE_ACCOUNT_PATH'),
  port: getOptional('PORT', '3000'),
};

module.exports = { env };
