const status = {
  startedAt: new Date().toISOString(),
  discord: {
    state: 'starting',
    ready: false,
    lastReadyAt: '',
    lastDisconnectAt: '',
    lastReconnectAt: '',
    lastResumeAt: '',
    lastErrorAt: '',
    lastErrorMessage: '',
    wsStatus: null,
    ping: null,
  },
};

function updateDiscord(partial) {
  status.discord = { ...status.discord, ...partial };
}

function getStatus(client) {
  return {
    ...status,
    uptimeSeconds: Math.floor(process.uptime()),
    discord: {
      ...status.discord,
      ready: client ? client.isReady() : status.discord.ready,
      wsStatus: client ? client.ws.status : status.discord.wsStatus,
      ping: client ? client.ws.ping : status.discord.ping,
    },
  };
}

module.exports = { updateDiscord, getStatus };
