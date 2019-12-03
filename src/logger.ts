import winston from 'winston';
import logdnaWinston from 'logdna-winston';

const defaultLogger = winston.createLogger({
  transports: [],
  level: 'info',
});

if (process.env.NODE_ENV !== 'production') {
  defaultLogger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export let log: winston.Logger = defaultLogger;

export const configureLogger = (apiKey: string | undefined, app: string | undefined) => {
  if (!apiKey || !app) return;

  const options = {
    key: apiKey,
    app,
    env: process.env.NODE_ENV,
  };

  log = winston.createLogger({
    transports: [new logdnaWinston(options)],
    level: 'info',
  });

  if (process.env.NODE_ENV !== 'production') {
    log.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    );
  }
};
