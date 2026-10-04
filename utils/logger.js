const LEVELS = ['debug', 'info', 'warn', 'error'];

function log(level, message, meta = {}) {
  if (!LEVELS.includes(level)) level = 'info';
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: String(message),
    ...meta
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  return entry;
}

module.exports = {
  debug: (m, x) => log('debug', m, x),
  info: (m, x) => log('info', m, x),
  warn: (m, x) => log('warn', m, x),
  error: (m, x) => log('error', m, x),
  log
};
