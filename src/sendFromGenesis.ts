import { utils } from '@tixl/tixl-ledger';
import { getBlockchain, sendTx } from './gateway-helper';
import { Blockchain } from '@tixl/tixl-ledger/lib/types/src/Blockchain';
import { BlockResult } from '@tixl/tixl-ledger/lib/src/utils/blocks';
import { log } from './logger';

let localChain: Blockchain | undefined = undefined;

const fetchLatestChain = async () => {
  log.info('Fetching latest chain');
  const genChain = await getBlockchain(process.env.GEN_SIG_PUB || '');
  if (!genChain) throw 'no genesis chain found';
  if (!localChain) {
    log.info('No local chain found');
    localChain = genChain;
    return;
  }
  const localLeaf = localChain.leaf();
  const genLeaf = genChain.leaf();
  if (localLeaf === undefined) throw 'local chain has no leaf';
  if (genLeaf === undefined) throw 'remote chain has no leaf';

  if (localLeaf.signature === genLeaf.signature) {
    log.info('Chain is up to date');
    return;
  } else {
    const localSigs = localChain.blocks.map(x => x.signature);
    if (localSigs.indexOf(genLeaf.signature) >= 0) {
      log.info('Local chain has more blocks');
      return;
    } else {
      log.info('Remote chain has more blocks, update');
      localChain = genChain;
      return;
    }
  }
};

const updateLatestChain = (sendBlock: BlockResult) => {
  if (localChain) {
    localChain.addBlock(sendBlock.block);
  } else {
    throw 'latest chain does not exist';
  }
};

export const sendFromGenesis = async (address: string): Promise<{ sendAmount: bigint; hash: string }> => {
  await fetchLatestChain();
  const genChain = localChain;
  const genLeaf = genChain && genChain.leaf();
  if (!genChain || !genLeaf) throw 'no genesis chain found';
  await utils.decryptSender(genLeaf, process.env.GEN_AES || '', true);
  await utils.decryptReceiver(genLeaf, process.env.GEN_NTRU_PRIV || '');
  const rndTxl = Math.floor(Math.random() * 5000000) + 1; // rng between 1..5,000,000
  const sendAmount = BigInt(rndTxl) * BigInt(Math.pow(10, 4));
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

  const hash = await sendTx(send.tx);
  updateLatestChain(send);
  return { sendAmount, hash };
};
