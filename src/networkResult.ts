import { Signature } from '@tixl/tixl-types';

import { getBlock } from './gateway-helper';
import { log } from './logger';

export async function networkResult(signature: Signature) {
  return new Promise(resolve => {
    let counter = 0;

    const id = setInterval(async () => {
      counter++;

      // if counter too high, then timeout
      if (counter > 10) {
        log.info('network confirmation timeout');

        clearInterval(id);
        resolve();
        return;
      }

      // if block is still in progress, wait and repeat
      const mayBeBlock = await getBlock(signature);

      if (!mayBeBlock) {
        return;
      }

      log.info('got network confirmation', { signature: mayBeBlock.signature });

      clearInterval(id);
      resolve();
    }, 1000);
  });
}
