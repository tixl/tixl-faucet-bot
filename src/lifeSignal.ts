import { log } from './logger';

export const startLifeSignal = () => {
  const send = () => {
    log.info('Life signal');
    setTimeout(() => send(), 15000);
  };
  send();
};
