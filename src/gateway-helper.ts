import axios from 'axios';
import {
  Transaction,
  Blockchain,
  SigPublicKey,
  fromBlockchainObject,
  Signature,
  fromBlockObject,
  Block,
} from '@tixl/tixl-types';

import { log } from './logger';
import { calculateDoublePow } from './microPow';

const sendUrl = process.env.GATEWAY_URL + '/transaction';
const chainUrl = process.env.GATEWAY_URL + '/blockchain';
const blockUrl = process.env.GATEWAY_URL + '/block';

export async function getBlock(signature: Signature): Promise<Block | undefined> {
  return axios
    .get(blockUrl + `?signature=${signature}`, {
      headers: {
        'content-type': 'application/json',
      },
    })
    .then(res => {
      if (res && res.data && res.data.block) {
        const block = fromBlockObject(res.data.block);

        return block;
      }

      return undefined;
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // that is OK
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        log.error('cannot reach gateway', error.message);
      } else {
        // Something happened in setting up the request that triggered an Error
        log.error('Error', error.message);
      }

      return undefined;
    });
}

export async function getBlockchain(signaturePublicKey: SigPublicKey, full = false): Promise<Blockchain | undefined> {
  const res = await axios.get(chainUrl + `?signaturePublicKey=${signaturePublicKey}&full=${full}`, {
    headers: {
      'content-type': 'application/json',
    },
  });

  if (res.status !== 200) {
    log.error('cannot reach gateway', { statusText: res.statusText });
    return;
  }

  const chain = fromBlockchainObject(res.data.blockchain);

  return chain;
}

const powTarget = [
  { pos: 0, character: '0' },
  { pos: 1, character: '0' },
  { pos: 2, character: '0' },
  { pos: 3, character: '0' },
];

const powTargetAlt = [
  { pos: 0, character: '1' },
  { pos: 1, character: '1' },
  { pos: 2, character: '1' },
  { pos: 3, character: '1' },
];

export async function sendTx(transaction: Transaction) {
  log.info('sending tx to gateway', { publicSig: transaction.publicSig });

  transaction.blocks = transaction.blocks.map(block => {
    const nonce = calculateDoublePow(block.prev as string, powTarget, powTargetAlt);
    return { ...block, nonce } as any;
  });

  const res = await axios.post(sendUrl, {
    transaction,
  });

  if (res.status === 200) {
    const hash = res.data && res.data.hash;

    if (hash) {
      log.info('send tx; hash: ' + hash);
      return hash;
    }

    return;
  }

  throw res.statusText;
}
