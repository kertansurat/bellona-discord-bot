const { logger } = require('../logger/logger');
const { updateDiscord } = require('../state/runtimeStatus');

const CHECK_INTERVAL_MS = 30000;
const MAX_NOT_READY_CHECKS = 4;
const MAX_RECOVERY_ATTEMPTS = 3;

function startAutoRecovery(client, token) {
  let notReadyChecks = 0;
  let recoveryAttempts = 0;
  let recovering = false;

  async function recover(reason) {
    if (recovering) return;
    recovering = true;
    recoveryAttempts += 1;

    logger.warn('Discord auto recovery started', {
      reason,
      recoveryAttempts,
      maxRecoveryAttempts: MAX_RECOVERY_ATTEMPTS,
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });

    updateDiscord({
      state: 'auto_recovering',
      ready: false,
      lastReconnectAt: new Date().toISOString(),
      wsStatus: client.ws.status,
      ping: client.ws.ping,
    });

    try {
      if (client.isReady()) {
        logger.info('Auto recovery skipped because client is ready again');
        notReadyChecks = 0;
        recoveryAttempts = 0;
        return;
      }

      try {
        client.destroy();
      } catch (error) {
        logger.warn('client.destroy failed during recovery', { message: error.message });
      }

      await new Promise(resolve => setTimeout(resolve, 5000));

      await client.login(token);

      logger.info('Discord auto recovery login requested');
      notReadyChecks = 0;
    } catch (error) {
      logger.error('Discord auto recovery failed', error);

      updateDiscord({
        state: 'auto_recovery_failed',
        ready: false,
        lastErrorAt: new Date().toISOString(),
        lastErrorMessage: error.message,
        wsStatus: client.ws.status,
        ping: client.ws.ping,
      });

      if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
        logger.error('Max auto recovery attempts reached. Exiting process so Render can restart service.', {
          recoveryAttempts,
          maxRecoveryAttempts: MAX_RECOVERY_ATTEMPTS,
        });

        setTimeout(() => process.exit(1), 1000);
      }
    } finally {
      recovering = false;
    }
  }

  setInterval(() => {
    const ready = client.isReady();

    if (ready) {
      if (notReadyChecks > 0 || recoveryAttempts > 0) {
        logger.info('Discord client ready again, resetting recovery counters');
      }

      notReadyChecks = 0;
      recoveryAttempts = 0;
      return;
    }

    notReadyChecks += 1;

    logger.warn('Discord client not ready detected', {
      notReadyChecks,
      maxNotReadyChecks: MAX_NOT_READY_CHECKS,
      wsStatus: client.ws.status,
      ping: client.ws.ping,
      uptimeSeconds: Math.floor(process.uptime()),
    });

    if (notReadyChecks >= MAX_NOT_READY_CHECKS) {
      recover('client_not_ready_threshold');
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startAutoRecovery };
