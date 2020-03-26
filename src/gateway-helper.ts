import axios from 'axios';
import { Transaction, Blockchain, SigPublicKey, fromBlockchainObject } from '@tixl/tixl-types';

import { log } from './logger';

const sendUrl = process.env.GATEWAY_URL + '/transaction';
const chainUrl = process.env.GATEWAY_URL + '/blockchain';

export async function getBlockchain(signaturePublicKey: SigPublicKey): Promise<Blockchain | undefined> {
  const res = await axios.get(chainUrl + `?signaturePublicKey=${signaturePublicKey}`, {
    headers: {
      'content-type': 'application/json',
    },
  });

  if (res.status !== 200) {
    log.error('FAUCET BOT cannot reach gateway', { statusText: res.statusText });
    return;
  }

  const chain = fromBlockchainObject(res.data.blockchain);

  return chain;
}

export async function sendTx(transaction: Transaction) {
  const res = await axios.post(sendUrl, {
    transaction,
  });

  if (res.status === 200) {
    const hash = res.data && res.data.hash;

    if (hash) {
      log.info('FAUCET BOT send tx; hash: ' + hash);
      return hash;
    }

    return;
  }

  throw res.statusText;
}
