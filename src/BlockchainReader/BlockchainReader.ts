import BitcoinCore = require('bitcoin-core')
import { injectable, Container } from 'inversify'
import { MongoClient, Db } from 'mongodb'
import * as Pino from 'pino'

import { createModuleLogger } from 'Helpers/Logging'
import { Messaging } from 'Messaging/Messaging'

import { BlockchainReaderConfiguration } from './BlockchainReaderConfiguration'
import { BlockchainReaderService } from './BlockchainReaderService'
import { BlockchainReaderServiceConfiguration } from './BlockchainReaderServiceConfiguration'
import { ClaimController } from './ClaimController'
import { ClaimControllerConfiguration } from './ClaimControllerConfiguration'

@injectable()
export class BlockchainReader {
  private readonly logger: Pino.Logger
  private readonly configuration: BlockchainReaderConfiguration
  private readonly container = new Container()
  private dbConnection: Db
  private messaging: Messaging
  private cron: BlockchainReaderService

  constructor(configuration: BlockchainReaderConfiguration) {
    this.configuration = configuration
    this.logger = createModuleLogger(configuration, __dirname)
  }

  async start() {
    this.logger.info({ configuration: this.configuration }, 'BlockchainReader Starting')
    const mongoClient = await MongoClient.connect(this.configuration.dbUrl)
    this.dbConnection = await mongoClient.db()

    this.messaging = new Messaging(this.configuration.rabbitmqUrl)
    await this.messaging.start()

    this.initializeContainer()

    this.cron = this.container.get('Cron')
    await this.cron.start()

    this.logger.info('BlockchainReader Started')
  }

  initializeContainer() {
    this.container.bind<Pino.Logger>('Logger').toConstantValue(this.logger)
    this.container.bind<ClaimController>('ClaimController').to(ClaimController)
    this.container.bind<BlockchainReaderService>('Cron').to(BlockchainReaderService)
    this.container.bind<Db>('DB').toConstantValue(this.dbConnection)
    this.container.bind<Messaging>('Messaging').toConstantValue(this.messaging)
    this.container.bind<BitcoinCore>('BitcoinCore').toConstantValue(
      new BitcoinCore({
        host: this.configuration.bitcoinUrl,
        port: this.configuration.bitcoinPort,
        network: this.configuration.bitcoinNetwork,
        username: this.configuration.bitcoinUsername,
        password: this.configuration.bitcoinPassword,
      })
    )
    this.container
      .bind<ClaimControllerConfiguration>('ClaimControllerConfiguration')
      .toConstantValue(this.configuration)
    this.container.bind<BlockchainReaderServiceConfiguration>('BlockchainReaderServiceConfiguration').toConstantValue({
      minimumBlockHeight: this.configuration.minimumBlockHeight,
      blockchainReaderIntervalInSeconds: this.configuration.blockchainReaderIntervalInSeconds,
      forceBlockHeight: this.configuration.forceBlockHeight,
    })
  }
}
