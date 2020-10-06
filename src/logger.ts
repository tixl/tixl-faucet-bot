import winston, { format } from 'winston';
import ApexLogsTransport from 'apex-logs-winston';

const { printf, combine, timestamp } = format;

const myFormat = combine(
  timestamp(),
  printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  }),
);

const defaultLogger = winston.createLogger({
  transports: [],
  level: 'info',
});
if (process.env.NODE_ENV !== 'production') {
  defaultLogger.add(
    new winston.transports.Console({
      format: myFormat,
    }),
  );
}
export let log: winston.Logger = defaultLogger;
export const configureLogger = (
  url: string | undefined,
  authToken: string | undefined,
  projectId: string | undefined,
  net: string | undefined,
  service: string | undefined,
) => {
  if (!url || !authToken || !projectId) return;
  const apex = new ApexLogsTransport({
    url,
    authToken,
    projectId,
  });
  log = winston.createLogger({
    transports: [apex],
    level: 'debug',
    defaultMeta: { net, service },
  });
  if (process.env.NODE_ENV !== 'production') {
    log.add(
      new winston.transports.Console({
        format: myFormat,
      }),
    );
  }
};
export const shortenObjectValues = (o: any, max: number = 32) => {
  const n: any = {};
  for (const key in o) {
    const val = o[key];
    if (typeof val === 'string') {
      n[key] = val.slice(0, max);
    } else {
      n[key] = o[key];
    }
  }
  return n;
};
