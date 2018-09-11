import { PoetTimestamp, TransactionPoetTimestamp } from '@po.et/poet-js'
import { equals, allPass } from 'ramda'

import { PREFIX_BARD, PREFIX_POET, Block, Transaction, VOut } from 'Helpers/Bitcoin'
import { isTruthy } from 'Helpers/isTruthy'

interface VOutWithTxId extends VOut {
  readonly transactionId: string
}

export const blockToPoetAnchors = (block: Block): ReadonlyArray<PoetTimestamp> =>
  block.tx
    .map(transactionToPoetAnchor)
    .filter(isTruthy)
    .filter(poetAnchorHasCorrectPrefix)
    .map(poetAnchorWithBlockData(block))

function transactionToPoetAnchor(transaction: Transaction): TransactionPoetTimestamp | undefined {
  const outputs = transactionToOutputs(transaction)
  const dataOutput = outputs.find(outputIsDataOutput)
  return dataOutput && dataOutputToPoetAnchor(dataOutput)
}

const transactionToOutputs = (transaction: Transaction): ReadonlyArray<VOutWithTxId> =>
  transaction.vout.map(vout => ({
    ...vout,
    transactionId: transaction.txid,
  }))

const outputIsDataOutput = (output: VOut) => output.scriptPubKey.type === 'nulldata'

const dataOutputToPoetAnchor = (dataOutput: VOutWithTxId): TransactionPoetTimestamp => {
  // TODO: split method in two. see https://github.com/poetapp/node/issues/418
  const { asm } = dataOutput.scriptPubKey
  const data = asm.split(' ')[1]
  const buffer = Buffer.from(data, 'hex')
  const prefix = buffer.slice(0, 4).toString()
  const version = Array.from(buffer.slice(4, 8))
  const ipfsDirectoryHash = buffer.slice(8).toString()
  return {
    transactionId: dataOutput.transactionId,
    outputIndex: null,
    prefix,
    version,
    ipfsDirectoryHash,
  }
}

const poetAnchorHasCorrectPrefix = (poetAnchor: TransactionPoetTimestamp) =>
  [PREFIX_BARD, PREFIX_POET].includes(poetAnchor.prefix)

const poetAnchorWithBlockData = (block: Block) => (poetAnchor: TransactionPoetTimestamp): PoetTimestamp => ({
  ...poetAnchor,
  blockHeight: block.height,
  blockHash: block.hash,
})

const anchorPrefixMatches = (prefix: string) => (anchor: PoetTimestamp) => equals(anchor.prefix, prefix)
const anchorVersionMatches = (version: ReadonlyArray<number>) => (anchor: PoetTimestamp) =>
  equals(anchor.version, version)

export const anchorPrefixAndVersionMatch = (prefix: string, version: ReadonlyArray<number>) =>
  allPass([anchorPrefixMatches(prefix), anchorVersionMatches(version)])
