import { AssetSymbol, Block, Signature } from '@tixl/tixl-types';
import { createSendBlock, decryptSender, decryptReceiver } from '@tixl/tixl-crypto';

import { sendTx, getBlockchain } from './gateway-helper';
import { getSerialBlockchain, setLatestBlockchain } from './serialBlockchain';
import { log } from './logger';

export const sendFromGenesis = async (address: string): Promise<{ sendAmount: bigint; signature: Signature }> => {
  await getSerialBlockchain();

  // fetch a fresh version of the genesis chain to have a chance against the wallet bots
  const genChain = await getBlockchain(process.env.GEN_SIG_PUB || '');

  const genLeaf = genChain && genChain.leaf();

  if (!genChain || !genLeaf) throw 'no genesis chain found';

  await decryptSender(genLeaf, process.env.GEN_AES || '');
  await decryptReceiver(genLeaf, process.env.GEN_NTRU_PRIV || '');

  const rndTxl = Math.floor(Math.random() * 5000000) + 1; // rng between 1..5,000,000
  const sendAmount = BigInt(rndTxl) * BigInt(Math.pow(10, 4));
  const newGenBalance = BigInt(genLeaf.senderBalance) - sendAmount;

  log.info('Current genesis balance', { balance: String(genLeaf.senderBalance) });

  const send = await createSendBlock(
    genChain.leaf() as Block,
    genChain.publicSig,
    sendAmount,
    newGenBalance,
    AssetSymbol.TXL,
    process.env.GEN_SIG_PRIV,
    address,
    process.env.GEN_AES,
  );

  await sendTx(send.tx);

  const signature = send.block.signature;

  genChain.addBlock(send.block);
  setLatestBlockchain(genChain);

  return { sendAmount, signature };
};
