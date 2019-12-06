import { utils } from '@tixl/tixl-ledger';
import { getBlockchain, sendTx } from './gateway-helper';

export const sendFromGenesis = async (address: string): Promise<bigint> => {
  const genChain = await getBlockchain(process.env.GEN_SIG_PUB || '');
  const genLeaf = genChain && genChain.leaf();
  if (!genChain || !genLeaf) throw 'no genesis chain found';
  await utils.decryptSender(genLeaf, process.env.GEN_AES || '', true);
  await utils.decryptReceiver(genLeaf, process.env.GEN_NTRU_PRIV || '');
  const rndTxl = Math.floor(Math.random() * 5000) + 1; // rng between 1..5000
  const sendAmount = BigInt(rndTxl) * BigInt(Math.pow(10, 7));
  const newGenBalance = BigInt(genLeaf.senderBalance) - sendAmount;
  const send = await utils.createSendBlock(
    genChain,
    sendAmount,
    newGenBalance,
    process.env.GEN_SIG_PRIV,
    address,
    process.env.GEN_AES,
  );
  send.tx.slot = 0;

  await sendTx(send.tx);

  return sendAmount;
};
