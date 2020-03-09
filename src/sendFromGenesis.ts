import { utils } from '@tixl/tixl-ledger';
import { AssetSymbol, Block } from '@tixl/tixl-types';

import { sendTx } from './gateway-helper';
import { getSerialBlockchain, setLatestBlockchain } from './serialBlockchain';
import { log } from './logger';

export const sendFromGenesis = async (address: string): Promise<{ sendAmount: bigint; hash: string }> => {
  const genChain = await getSerialBlockchain();
  const genLeaf = genChain && genChain.leaf();

  if (!genChain || !genLeaf) throw 'no genesis chain found';

  const leaf = { ...genLeaf } as Block;

  await utils.decryptSender(leaf, process.env.GEN_AES || '', true);
  await utils.decryptReceiver(leaf, process.env.GEN_NTRU_PRIV || '');

  const rndTxl = Math.floor(Math.random() * 5000000) + 1; // rng between 1..5,000,000
  const sendAmount = BigInt(rndTxl) * BigInt(Math.pow(10, 4));
  const newGenBalance = BigInt(leaf.senderBalance) - sendAmount;

  log.info('Current genesis balance', { balance: String(leaf.senderBalance) });

  const send = await utils.createSendBlock(
    leaf,
    genChain.publicSig,
    sendAmount,
    newGenBalance,
    AssetSymbol.TXL,
    process.env.GEN_SIG_PRIV,
    address,
    process.env.GEN_AES,
  );

  const hash = await sendTx(send.tx);

  genChain.addBlock(send.block);
  setLatestBlockchain(genChain);

  return { sendAmount, hash };
};
