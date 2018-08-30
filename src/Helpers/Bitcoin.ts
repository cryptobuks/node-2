import { PoetTimestamp, TransactionPoetTimestamp } from '@po.et/poet-js'

import { Block, Transaction, VOut } from 'Interfaces'

export const PREFIX_POET = 'POET'
export const PREFIX_BARD = 'BARD'

interface VOutWithTxId extends VOut {
  readonly transactionId: string
}

export const blockToPoetAnchors = (block: Block): ReadonlyArray<PoetTimestamp> =>
  block.tx
    .map(transactionToPoetAnchor)
    .filter(_ => _)
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

export enum GetBlockVerbosity {
  Hex = 0,
  Parsed = 1,
  Transactions = 2,
}