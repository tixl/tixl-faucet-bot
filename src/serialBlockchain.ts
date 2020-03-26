import { Blockchain } from '@tixl/tixl-types';

import { getBlockchain, getBlock } from './gateway-helper';
import { log } from './logger';

let busy = false;
let latestBlockchain: Blockchain | undefined = undefined;

/**
 * When this function resolves, the latest block was accepted by the network and therefor the chain ready for a new block.
 * This function allows that only one caller will receive the latest blockchain.
 */
export async function getSerialBlockchain(): Promise<void> {
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
      if (!latestBlockchain) return sendNextBlock();

      // check that the latest block signature is accepted
      const latestSendBlock = latestBlockchain.leaf();

      if (!latestSendBlock) return log.error('Chains without leaf blocks are invalid');

      const maybeAcceptedBlock = await getBlock(latestSendBlock.signature);

      if (maybeAcceptedBlock) {
        // network accepted the latest send block
        return sendNextBlock();
      }

      // network is not up to date simply try again in the next interval
    }, 5000);

    const sendNextBlock = () => {
      clearInterval(interval);
      resolve();
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
