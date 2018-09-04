import { describe } from 'riteway';

import { getId } from './Claim'

describe('getId', async should => {
  const { assert } = should('return the correct value');

  {
    const id = 'bar'
    const obj = { 'foo': 'foo', id, 'baz': 'baz' }
    assert({
      given: 'a claim',
      expected: id,
      actual: getId(obj)
    })
  }
})
