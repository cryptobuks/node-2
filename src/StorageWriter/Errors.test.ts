import { describe } from 'riteway'
import { Claim } from '@po.et/poet-js'

import { ErrorTypes, uploadClaimError, updateClaimHashError } from './Errors';

describe('uploadClaimError', async should => {
  const { assert } = should()
  {
    const message = new Error('foo').message
    const claim = { id: 'bar' } as Claim
  
    assert({
      given: 'all arguments',
      should: 'return the correct object',
      actual: uploadClaimError(message, claim),
      expected: {
        type: ErrorTypes.UPLOAD_CLAIM_ERROR,
        details: {
          message,
          claim,
        }
      }
    })
  }
})

describe('updateClaimHashError', async should => {
  const { assert } = should()
  {
    const message = new Error('foo').message
    const claim = { id: 'bar' } as Claim
    const hash = 'baz'
  
    assert({
      given: 'all arguments',
      should: 'return the correct object',
      actual: updateClaimHashError(message, claim, hash),
      expected: {
        type: ErrorTypes.UPDATE_CLAIM_HASH_ERROR,
        details: {
          message,
          claim,
          hash
        }
      }
    })
  }
})