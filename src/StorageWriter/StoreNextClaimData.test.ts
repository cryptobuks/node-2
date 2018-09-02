import { describe } from 'riteway';

import { setIPFSFileHash, setClaim, getIPFSFileHash, getClaim } from './StoreNextClaimData'

describe('setIPFSFileHash', async should => {
  const { assert } = should('return the correct object');

  {
    const ipfsFileHash = 'bar'
    const obj = { 'foo': 'foo' }
    const expected = {
      ...obj,
      ipfsFileHash
    }
    assert({
      given: 'hash and object',
      expected,
      actual: setIPFSFileHash(ipfsFileHash, obj)
    })
  }
})

describe('setClaim', async should => {
  const { assert } = should('return the correct object');

  {
    const claim = { bar: 'bar' }
    const obj = { 'foo': 'foo' }
    const expected = {
      ...obj,
      claim
    }
    assert({
      given: 'claim and object',
      expected,
      actual: setClaim(claim, obj)
    })
  }
})

describe('getIPFSFileHash', async should => {
  const { assert } = should('return the correct value');

  {
    const ipfsFileHash = 'bar'
    const obj = {
      'foo': 'foo',
      ipfsFileHash
    }
    assert({
      given: 'an object that contains a hash',
      expected: ipfsFileHash,
      actual: getIPFSFileHash(obj)
    })
  }
})

describe('getClaim', async should => {
  const { assert } = should('return the correct value');

  {
    const claim = { bar: 'bar' }
    const obj = {
      'foo': 'foo',
      claim
    }
    assert({
      given: 'object that contains a claim',
      expected: claim,
      actual: getClaim(obj)
    })
  }
})
