import BitcoinCore = require('bitcoin-core')
import { lensProp, pipeP, view } from 'ramda'

const viewHex = view(lensProp('hex'))

const dataToOutput = async (data: string) => ({ data })

export type anchorData = (bitcoinCore: BitcoinCore) => (data: string) => Promise<string>

export const anchorData = (bitcoinCore: BitcoinCore) =>
  pipeP(
    dataToOutput,
    bitcoinCore.createRawTransaction.bind(this.bitcoinCore, []),
    bitcoinCore.fundRawTransaction.bind(bitcoinCore),
    viewHex,
    bitcoinCore.signRawTransaction.bind(bitcoinCore),
    viewHex,
    bitcoinCore.sendRawTransaction.bind(bitcoinCore),
  )
