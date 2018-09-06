import BitcoinCore = require('bitcoin-core')
import { inject, injectable } from 'inversify'
import { Collection, Db } from 'mongodb'
import * as Pino from 'pino'

import { UnspentOutput } from 'Helpers/Bitcoin'
import { childWithFileName } from 'Helpers/Logging'
import { Exchange } from 'Messaging/Messages'
import { Messaging } from 'Messaging/Messaging'

import { amountMinusFee, getData, getOutputs, selectBestUTXOs, unspentToInput } from './Bitcoin'
import { ClaimControllerConfiguration } from './ClaimControllerConfiguration'

@injectable()
export class ClaimController {
  private readonly logger: Pino.Logger
  private readonly db: Db
  private readonly collection: Collection
  private readonly messaging: Messaging
  private readonly bitcoinCore: BitcoinCore
  private readonly configuration: ClaimControllerConfiguration

  constructor(
    @inject('Logger') logger: Pino.Logger,
    @inject('DB') db: Db,
    @inject('Messaging') messaging: Messaging,
    @inject('BitcoinCore') bitcoinCore: BitcoinCore,
    @inject('ClaimControllerConfiguration') configuration: ClaimControllerConfiguration
  ) {
    this.logger = childWithFileName(logger, __filename)
    this.db = db
    this.messaging = messaging
    this.bitcoinCore = bitcoinCore
    this.configuration = configuration
    this.collection = this.db.collection('blockchainWriter')
  }

  async requestTimestamp(ipfsDirectoryHash: string): Promise<void> {
    this.logger.trace({
      method: 'timestampWithRetry',
      ipfsDirectoryHash,
    })
    await this.collection.insertOne({
      ipfsDirectoryHash,
      txId: null,
    })
  }

  async timestampNextHash() {
    const logger = this.logger.child({ method: 'timestampNextHash' })

    logger.trace('Retrieving Next Hash To Timestamp')

    const entry = await this.collection.findOne({ txId: null })
    const ipfsDirectoryHash = entry && entry.ipfsDirectoryHash

    this.logger.trace({ ipfsDirectoryHash }, 'Next Hash To Timestamp Retrieved')

    if (!ipfsDirectoryHash) return

    try {
      await this.timestamp(ipfsDirectoryHash)
    } catch (exception) {
      logger.warn(
        {
          ipfsDirectoryHash,
          exception,
        },
        'Uncaught Exception While Timestamping Hash'
      )
    }
  }

  private async timestamp(ipfsDirectoryHash: string): Promise<void> {
    const { bitcoinCore, configuration } = this
    const logger = this.logger.child({ method: 'timestamp' })

    logger.debug({ ipfsDirectoryHash }, 'Anchoring IPFS Hash')

    const utxo = (await bitcoinCore.listUnspent()) as ReadonlyArray<UnspentOutput>

    if (!utxo || !utxo.length) throw new Error(`Wallet seems to be empty.`)

    logger.trace(
      {
        utxo,
      },
      'Got UTXO from Bitcoin Core'
    )

    const bestUtxo = selectBestUTXOs(utxo)

    logger.trace(
      {
        bestUtxo,
      },
      'Got best UTXO from Bitcoin Core'
    )

    const newAddress = await bitcoinCore.getNewAddress()

    logger.trace(
      {
        newAddress,
      },
      'Got new address from Bitcoin Core'
    )

    const data = getData(configuration.poetNetwork, configuration.poetVersion, ipfsDirectoryHash)
    const inputs = bestUtxo.map(unspentToInput)
    const outputs = getOutputs(data, newAddress, amountMinusFee(bestUtxo[0].amount))

    const rawTx = await bitcoinCore.createRawTransaction(inputs, outputs)

    logger.trace(
      {
        rawTx,
      },
      'Got rawTx from Bitcoin Core'
    )

    const tx = await bitcoinCore.signRawTransaction(rawTx)

    logger.trace(
      {
        tx,
      },
      'Got signed tx from Bitcoin Core'
    )

    const txId = await bitcoinCore.sendRawTransaction(tx.hex)

    logger.trace(
      {
        txId,
      },
      'Transaction broadcasted'
    )

    await this.collection.updateOne({ ipfsDirectoryHash }, { $set: { txId } }, { upsert: true })
    await this.messaging.publish(Exchange.IPFSHashTxId, {
      ipfsDirectoryHash,
      txId,
    })
  }
}
