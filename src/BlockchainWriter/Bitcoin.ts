import { UnspentOutput } from 'Helpers/Bitcoin'

export const unspentToInput = ({ txid, vout }: any) => ({ txid, vout })

export const getOutputs = (data: string, address: string, amount: number) => ({
  data,
  [address]: amount,
})

export const getData = (prefix: string, version: ReadonlyArray<number>, message: string) =>
  Buffer.concat([Buffer.from(prefix), Buffer.from([...version]), Buffer.from(message)]).toString('hex')

// Use only up to 5 unused outputs to avoid large transactions,
// picking the ones with the most satoshis to ensure enough fee.
// const topUtxo = utxo
//   .slice()
//   .sort((a, b) => b.satoshis - a.satoshis)
//   .slice(0, 5)
export const selectBestUTXOs = (unspentTransactionOutputs: ReadonlyArray<UnspentOutput>) =>
  unspentTransactionOutputs.slice(0, 1)

export const amountMinusFee = (amount: number) => (amount * 1000 - 1) / 1000
