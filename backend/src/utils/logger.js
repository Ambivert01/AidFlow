/*
 * Centralized Logger
 * (can be replaced by Winston / Pino later)
 */

const log = (level, message, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  console.log(JSON.stringify(entry));
};

export const logger = {
  info: (msg, meta) => log("INFO", msg, meta),
  warn: (msg, meta) => log("WARN", msg, meta),
  error: (msg, meta) => log("ERROR", msg, meta),
  audit: (msg, meta) => log("AUDIT", msg, meta),
};
