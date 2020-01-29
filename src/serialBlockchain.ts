import { Blockchain } from '@tixl/tixl-types';

import { getBlockchain } from './gateway-helper';
import { log } from './logger';

let busy = false;
let latestBlockchain: Blockchain | undefined = undefined;

/**
 * When this function resolves, the latest block was accepted by the network and therefor the chain ready for a new block.
 * This function allows that only one caller will receive the latest blockchain.
 */
export async function getSerialBlockchain(): Promise<Blockchain> {
  return new Promise(resolve => {
    let myTurn = false;

    const interval = setInterval(async () => {
      // claim the slot
      if (busy && !myTurn) return;

      busy = true;
      myTurn = true;

      // call the network to check if the latest signature is accepted
      const chain = await getBlockchain(process.env.GEN_SIG_PUB || '');
      if (!chain) return;

      // nothing happened before
      if (!latestBlockchain) return leaveInterval(chain);

      const latestLeaf = latestBlockchain.leaf();
      const acceptedLeaf = chain.leaf();

      if (!latestLeaf || !acceptedLeaf) return log.error('Chains without leaf blocks are invalid');

      // network accepted the latest chain
      if (latestLeaf.signature === acceptedLeaf.signature) return leaveInterval(chain);

      // network is not up to date simply try again in the next interval
    }, 5000);

    const leaveInterval = (chain: Blockchain) => {
      clearInterval(interval);
      resolve(chain);
    };
  });
}

/**
 * The bot has to update the latest Blockchain to indicate that it is ready for the next round.
 */
export function setLatestBlockchain(chain: Blockchain) {
  if (!chain) {
    log.error('Tried to end cycle without new blockchain');
  }

  latestBlockchain = chain;
  busy = false;
}
