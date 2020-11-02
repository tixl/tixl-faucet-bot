import axios from 'axios';
import { SigPublicKey, Blockchain } from '@tixl/tixl-types';

const chainUrl = process.env.GATEWAY_URL + '/blockchain';

export default async function getBlockchain(publicSig: SigPublicKey): Promise<Blockchain | undefined> {
  return axios
    .get(chainUrl + `?full=false&signaturePublicKey=${publicSig}`)
    .then(res => {
      if (res.data.blockchain) {
        return res.data.blockchain;
      }
    })
    .catch(err => {
      if (!err.response) {
        console.error('gateway is unresponsive');
      } else if (err.response.status !== 404) {
        console.log('err', err);
      }
    });
}
