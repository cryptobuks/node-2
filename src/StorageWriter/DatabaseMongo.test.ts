import { describe } from 'riteway'
import { Claim } from '@po.et/poet-js'
import { FindAndModifyWriteOpResultObject } from 'mongodb';

import { getValueClaim } from './DatabaseMongo';

describe('getValueClaim', async should => {
  const { assert } = should('return the correct value')
  {
    const response: FindAndModifyWriteOpResultObject = {}
    assert({
      given: 'a response that does not contain a value',
      actual: getValueClaim(response),
      expected: undefined
    })
  }
  {
    const response: FindAndModifyWriteOpResultObject = { value: {} }
    assert({
      given: 'a response that does not contain a claim',
      actual: getValueClaim(response),
      expected: undefined
    })
  }
  {
    const claim = { id: 'bar' } as Claim
    const response: FindAndModifyWriteOpResultObject = { value: {
      claim
    } }
    assert({
      given: 'a response that contians a claim',
      actual: getValueClaim(response),
      expected: claim
    })
  }
})