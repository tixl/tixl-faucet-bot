import axios from 'axios';
import highwayhash from 'highwayhash';
import { Transaction } from '@tixl/tixl-ledger/lib/src/Transaction';
import { utils } from '@tixl/tixl-ledger';
import { Blockchain } from '@tixl/tixl-ledger/lib/types/src/Blockchain';
import { log } from './logger';

const sendUrl = process.env.GATEWAY_URL + '/transaction';
const chainUrl = process.env.GATEWAY_URL + '/blockchain';
const key = Buffer.from('eac831fe03fb16894d37a99dff3819ba26f5f4b4c7d1ccfc9085fe874aafd9f7', 'hex');

export function hashVal(val: string) {
  return highwayhash.asHexString(key, Buffer.from(val));
}

export async function getBlockchain(signaturePublicKey: string): Promise<Blockchain | undefined> {
  const res = await axios.post(chainUrl, {
    data: {
      signaturePublicKey,
    },
    headers: {
      'content-type': 'application/json',
    },
  });

  if (res.status !== 200) {
    log.error('WALLETBOTS cannot reach gateway', { statusText: res.statusText });
    return;
  }

  const chain = utils.blockchainFromObject(res.data.blockchain);

  return chain;
}

export async function sendTx(transaction: Transaction) {
  const res = await axios.post(sendUrl, {
    transaction,
  });

  if (res.status === 200) {
    const hash = res.data && res.data.hash;

    if (hash) {
      log.info('BOT WALLETS send tx; hash: ' + hash);
    }

    return;
  }

  throw res.statusText;
}
