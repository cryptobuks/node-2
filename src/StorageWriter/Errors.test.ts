import { describe } from 'riteway'
import { Claim } from '@po.et/poet-js'

import { UPLOAD_CLAIM_ERROR, uploadClaimError } from './Errors';

describe('uploadClaimError', async should => {
  const { assert } = should()
  {
    const message = new Error('foo').message
    const claim = { id: 'bar' } as Claim
  
    assert({
      given: 'all arguments',
      should: 'return the correct object',
      expected: {
        type: UPLOAD_CLAIM_ERROR,
        details: {
          message,
          claim,
        }
      },
      actual: uploadClaimError(message, claim)
    })
  }
})