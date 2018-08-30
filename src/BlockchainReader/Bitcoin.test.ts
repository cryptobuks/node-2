import { PoetTimestamp } from '@po.et/poet-js'
import { allPass, equals } from 'ramda'
import { describe } from 'riteway'

import { PREFIX_POET, PREFIX_BARD } from 'Helpers/Bitcoin'

import { blockToPoetAnchors } from './Bitcoin'

import * as TestBlock from './TestData/block-00000000000151360aad32397ff1cf7dd303bed163b0ef425e71a53ccdec7312.json'

describe('Bitcoin.blockToPoetAnchors', async (should: any) => {
  const { assert } = should()

  assert({
    given: 'testnet block 00000000000151360aad32397ff1cf7dd303bed163b0ef425e71a53ccdec7312',
    should: 'satisfy basic integrity checks',
    actual: validateTestBlockIntegrity(TestBlock),
    expected: true,
  })

  {
    const poetAnchors = blockToPoetAnchors(TestBlock as any) // as any: see footer note

    const isBardAnchor = (poetAnchor: PoetTimestamp) => poetAnchor.prefix === PREFIX_BARD
    const anchorIsVersion0003 = (poetAnchor: PoetTimestamp) => equals(poetAnchor.version, [0, 0, 0, 3])
    const anchorIsBlockHash = (poetAnchor: PoetTimestamp) => poetAnchor.blockHash === TestBlock.hash

    assert({
      given: 'blockToPoetAnchors(TestBlock)',
      should: 'return 5 Po.et Anchors',
      actual: poetAnchors.length,
      expected: 5,
    })

    assert({
      given: 'blockToPoetAnchors(TestBlock)',
      should: 'return prefix BARD anchors only',
      actual: poetAnchors.filter(isBardAnchor).length,
      expected: poetAnchors.length,
    })

    assert({
      given: 'blockToPoetAnchors(TestBlock)',
      should: 'return version 0.0.0.3 anchors only',
      actual: poetAnchors.filter(anchorIsVersion0003).length,
      expected: poetAnchors.length,
    })

    assert({
      given: 'blockToPoetAnchors(TestBlock)',
      should: 'all returned elements should have the blockHash set correctly',
      actual: poetAnchors.filter(anchorIsBlockHash).length,
      expected: poetAnchors.length,
    })
  }
})

// Would be way better to validate the block's hash
const validateTestBlockIntegrity = allPass([
  (block: any) => block.tx,
  (block: any) => Array.isArray(block.tx),
  (block: any) => block.tx.length === 3517,
])

/*
 TestBlock as any:
   TS actually parses the JSON and knows it has more properties than the ones defined in the Block interface,
   so the build fails.

   Rather than defining the complete interface for Block (which we don't need and is pretty complex),
   we can cast to any here and let it fail at run time if TestBlock isn't valid.

   This would only happen if we accidentally modified the block's json, which validateTestBlockIntegrity should prevent.
 */
