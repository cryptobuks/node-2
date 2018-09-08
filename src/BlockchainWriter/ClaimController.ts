import BitcoinCore = require('bitcoin-core')
import { inject, injectable } from 'inversify'
import { Collection, Db } from 'mongodb'
import * as Pino from 'pino'
import { pipeP, view, lensProp } from 'ramda'

import { childWithFileName } from 'Helpers/Logging'
import { Exchange } from 'Messaging/Messages'
import { Messaging } from 'Messaging/Messaging'

import { getData } from './Bitcoin'
import { ClaimControllerConfiguration } from './ClaimControllerConfiguration'
import { anchorData } from './anchorData'

@injectable()
export class ClaimController {
  private readonly logger: Pino.Logger
  private readonly db: Db
  private readonly collection: Collection
  private readonly messaging: Messaging
  private readonly bitcoinCore: BitcoinCore
  private readonly configuration: ClaimControllerConfiguration
  private readonly anchorData: (data: string) => Promise<string>
  private readonly ipfsDirectoryHashToBitcoinData: any

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
    this.anchorData = anchorData(bitcoinCore)
    this.ipfsDirectoryHashToBitcoinData = getData(configuration.poetNetwork, configuration.poetVersion)
  }

  async requestTimestamp(ipfsDirectoryHash: string): Promise<void> {
    this.logger.debug({
      method: 'timestampWithRetry',
      ipfsDirectoryHash,
    })
    await this.collection.insertOne({
      ipfsDirectoryHash,
      txId: null,
    })
  }

  async anchorNextIPFSDirectoryHash() {
    const logger = this.logger.child({ method: this.anchorNextIPFSDirectoryHash.name })

    logger.trace('Retrieving Next Hash To Anchor')

    const entry = await this.collection.findOne({ txId: null })
    const ipfsDirectoryHash = entry && entry.ipfsDirectoryHash

    this.logger.trace({ ipfsDirectoryHash }, 'Next IPFS Directory Hash To Anchor Retrieved')

    if (!ipfsDirectoryHash) return

    try {
      await this.anchorIPFSDirectoryHash(ipfsDirectoryHash)
    } catch (exception) {
      logger.warn(
        {
          ipfsDirectoryHash,
          exception,
        },
        'Unexpected Exception While Anchoring IPFS Directory Hash'
      )
    }
  }

  private async anchorIPFSDirectoryHash(ipfsDirectoryHash: string): Promise<void> {
    const { collection, messaging, anchorData, ipfsDirectoryHashToBitcoinData } = this
    const logger = this.logger.child({ method: 'anchorIPFSDirectoryHash' })

    logger.debug({ ipfsDirectoryHash }, 'Anchoring IPFS Hash')

    const data = ipfsDirectoryHashToBitcoinData(ipfsDirectoryHash)
    const txId = await anchorData(data)

    await collection.updateOne({ ipfsDirectoryHash }, { $set: { txId } }, { upsert: true })
    await messaging.publish(Exchange.IPFSHashTxId, {
      ipfsDirectoryHash,
      txId,
    })
  }

  // private anchorData = async (data: string) => {
  //   const { bitcoinCore, logger: parentLogger } = this
  //   const logger = parentLogger.child({ method: 'anchorData' })
  //
  //   // logger.debug({ data }, 'Anchoring data')
  //
  //   const trace = (message: string) => async <T extends object>(object: T) => {
  //     logger.trace(object, message)
  //     return object
  //   }
  //
  //   const debug = (message: string) => async <T extends object>(object: T) => {
  //     logger.trace(object, message)
  //     return object
  //   }
  //
  //   const traceGotFromBitcoinCore = (what: string) => trace(`Got ${what} from Bitcoin Core`)
  //
  //   const viewHex = view(lensProp('hex'))
  //
  //   const dataToOutput = async (data: string) => ({ data })
  //
  //   return pipeP(
  //     debug('Anchoring data'),
  //     dataToOutput,
  //     bitcoinCore.createRawTransaction.bind(this.bitcoinCore, []),
  //     traceGotFromBitcoinCore('raw transaction'),
  //     bitcoinCore.fundRawTransaction.bind(bitcoinCore),
  //     traceGotFromBitcoinCore('funded transaction'),
  //     viewHex,
  //     bitcoinCore.signRawTransaction.bind(bitcoinCore),
  //     traceGotFromBitcoinCore('signed raw transaction'),
  //     viewHex,
  //     bitcoinCore.sendRawTransaction.bind(bitcoinCore),
  //     traceGotFromBitcoinCore('sent raw transaction')
  //   )(data)
  // }
}
