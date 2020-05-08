import { Signature } from '@tixl/tixl-types';

import { getBlock } from './gateway-helper';
import { log } from './logger';

export async function networkResult(signature: Signature) {
  return new Promise(resolve => {
    const id = setInterval(async () => {
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
