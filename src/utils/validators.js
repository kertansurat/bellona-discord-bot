function cleanText(value) {
  return String(value || '').trim();
}

function parsePower(value) {
  const cleaned = String(value || '').replace(/,/g, '').trim();
  const power = Number(cleaned);
  if (!Number.isFinite(power) || power < 0) {
    throw new Error('POWER ต้องเป็นตัวเลขเท่านั้น');
  }
  return power;
}

module.exports = { cleanText, parsePower };
