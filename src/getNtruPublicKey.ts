import axios from 'axios';
import { SigPublicKey, NTRUPublicKey } from '@tixl/tixl-types';

const chainUrl = process.env.GATEWAY_URL + '/blockchain';

export default async function getNtruPublicKey(publicSig: SigPublicKey): Promise<NTRUPublicKey | undefined> {
  return axios
    .get(chainUrl + `?full=false&signaturePublicKey=${publicSig}`)
    .then(res => {
      if (res.data.blockchain) {
        return res.data.blockchain.publicNtru;
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
