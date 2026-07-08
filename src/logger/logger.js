function stamp() {
  return new Date().toISOString();
}

function stringifyMeta(meta) {
  if (!meta) return '';
  if (meta instanceof Error) {
    return ' ' + JSON.stringify({ message: meta.message, stack: meta.stack });
  }
  if (Object.keys(meta).length === 0) return '';
  return ' ' + JSON.stringify(meta);
}

const logger = {
  info(message, meta) {
    console.log(`[${stamp()}] [INFO] ${message}${stringifyMeta(meta)}`);
  },
  warn(message, meta) {
    console.log(`[${stamp()}] [WARN] ${message}${stringifyMeta(meta)}`);
  },
  error(message, meta) {
    console.log(`[${stamp()}] [ERROR] ${message}${stringifyMeta(meta)}`);
  },
};

module.exports = { logger };
