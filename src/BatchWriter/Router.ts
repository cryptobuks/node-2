import { inject, injectable } from 'inversify'
import * as Pino from 'pino'

import { childWithFileName } from 'Helpers/Logging'
import { Exchange } from 'Messaging/Messages'
import { Messaging } from 'Messaging/Messaging'

import { ClaimController } from './ClaimController'

@injectable()
export class Router {
  private readonly logger: Pino.Logger
  private readonly messaging: Messaging
  private readonly claimController: ClaimController

  constructor(
    @inject('Logger') logger: Pino.Logger,
    @inject('Messaging') messaging: Messaging,
    @inject('ClaimController') claimController: ClaimController
  ) {
    this.logger = childWithFileName(logger, __filename)
    this.messaging = messaging
    this.claimController = claimController
  }

  async start() {
    await this.messaging.consume(Exchange.ClaimIPFSHash, this.onClaimIPFSHash)
    await this.messaging.consume(Exchange.BatchWriterCreateNextBatchRequest, this.onBatchWriterCreateNextBatchRequest)
    await this.messaging.consume(
      Exchange.BlockchainWriterTimestampRequestCreated,
      this.onBlockchainWriterTimestampRequestCreated
    )
  }

  onClaimIPFSHash = async (message: any): Promise<void> => {
    const logger = this.logger.child({ method: 'onClaimIPFSHash' })
    const messageContent = message.content.toString()
    const item = JSON.parse(messageContent)

    try {
      await this.claimController.addEntry({ ipfsFileHash: item.ipfsHash })
    } catch (error) {
      logger.error(
        {
          error,
        },
        'Uncaught Exception while adding item to be batched'
      )
    }
  }

  onBatchWriterCreateNextBatchRequest = async () => {
    const logger = this.logger.child({ method: 'onBatchWriterCreateNextBatchRequest' })
    logger.trace('Create next batch request')
    try {
      const { ipfsFileHashes, ipfsDirectoryHash } = await this.claimController.createNextBatch()
      if (ipfsFileHashes.length > 0)
        await this.messaging.publish(Exchange.BatchWriterCreateNextBatchSuccess, { ipfsFileHashes, ipfsDirectoryHash })
      logger.info({ ipfsFileHashes, ipfsDirectoryHash }, 'Create next batch success')
    } catch (error) {
      logger.error({ error }, 'Create next batch failure')
    }
  }

  onBlockchainWriterTimestampRequestCreated = async (message: any): Promise<void> => {
    const logger = this.logger.child({ method: 'onBlockchainWriterTimestampRequestCreated' })
    const messageContent = message.content.toString()
    const { ipfsFileHashes, ipfsDirectoryHash } = JSON.parse(messageContent)
    logger.trace({ ipfsFileHashes, ipfsDirectoryHash }, 'Marking hashes as complete')
    try {
      await this.claimController.completeHashes({ ipfsFileHashes, ipfsDirectoryHash })
      logger.info({ ipfsFileHashes, ipfsDirectoryHash }, 'Succesfully marked hashes complete')
    } catch (error) {
      logger.error({ error, ipfsFileHashes, ipfsDirectoryHash }, 'Failed to marke hashes complete')
    }
  }
}
