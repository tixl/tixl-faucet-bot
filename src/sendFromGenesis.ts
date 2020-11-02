import Queue from 'promise-queue';
import { AssetSymbol, Block, Signature } from '@tixl/tixl-types';
import { createSendBlock } from '@tixl/tixl-sdk-js/workflows/api/send';

import { crypto } from './crypto';
import { sendTx, getBlockchain } from './gateway-helper';
import { networkResult } from './networkResult';
import { log } from './logger';

// all actions should be added to this queue
export const queue = new Queue(1, Infinity);

export const sendFromGenesis = async (address: string): Promise<{ sendAmount: bigint; signature: Signature }> => {
  // queue send block
  return queue.add(async () => {
    // fetch a fresh version of the genesis chain to have a chance against other genesis writers
    const genChain = await getBlockchain(process.env.GEN_SIG_PUB || '');
    const genLeaf = genChain && genChain.leaf();

    if (!genChain || !genLeaf) throw 'no genesis chain found';

    const baseAmount = Math.floor(Math.random() * 5000000) + 1; // rng between 1..5,000,000
    let rndTxl = baseAmount;
    if (Math.random() > 0.9) {
      rndTxl = rndTxl * 10;
      if (Math.random() > 0.9) {
        rndTxl = rndTxl * 10;
        if (Math.random() > 0.9) {
          rndTxl = rndTxl * 10;
        }
      }
    }
    const sendAmount = BigInt(rndTxl) * BigInt(Math.pow(10, 4));
    const newGenBalance = BigInt(genLeaf.senderBalance) - sendAmount;

    log.info('Current genesis balance', { balance: String(genLeaf.senderBalance) });

    const send = await createSendBlock(
      crypto,
      genChain.leaf() as Block,
      genChain.publicSig,
      sendAmount,
      newGenBalance,
      address,
      AssetSymbol.TXL,
      process.env.GEN_SIG_PRIV,
    );

    // send tx to gateway
    await sendTx(send.tx);

    const signature = send.block.signature;

    // wait til block is available
    await networkResult(signature);

    return { sendAmount, signature };
  });
};
