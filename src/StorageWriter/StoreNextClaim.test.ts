import { describe } from 'riteway';
import { setIPFSFileHash } from './StoreNextClaim'

describe('setIPFSFileHash', async should => {
  const { assert } = should('return the correct object');

  {
    const ipfsFileHash = 'foo'
    assert({
      given: 'empty object and hash',
      expected: { ipfsFileHash },
      actual: setIPFSFileHash(ipfsFileHash, {})
    })
  }
})

describe ('setClaim', async should => {
  const { assert } = should();

})