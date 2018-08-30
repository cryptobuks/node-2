import { describe } from 'riteway'

import { PREFIX_POET, PREFIX_BARD } from 'Helpers/Bitcoin'

import { blockToPoetAnchors } from './Bitcoin'

import * as TestBlock from './TestData/block-00000000000151360aad32397ff1cf7dd303bed163b0ef425e71a53ccdec7312.json'

describe('Bitcoin', async (should: any) => {
  const { assert } = should('')

  {
    console.log('block', TestBlock)
  }

})
