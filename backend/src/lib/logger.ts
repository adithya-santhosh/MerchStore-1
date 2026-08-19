import pino from "pino";

// Structured JSON logging — replaces scattered console.error/console.log
// calls so logs are queryable in prod (level, timestamp, and an `err` field
// with the serialized stack trace) instead of opaque strings.
const logger = pino({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "test" ? "silent" : process.env.NODE_ENV === "production" ? "info" : "debug"),
});

export default logger;
