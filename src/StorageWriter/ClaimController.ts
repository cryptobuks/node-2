import { Claim } from '@po.et/poet-js'
import { inject, injectable } from 'inversify'
import { Collection, Db } from 'mongodb'
import * as Pino from 'pino'
import { pipeM, lensProp } from 'ramda'

import { childWithFileName } from 'Helpers/Logging'
import { Messaging } from 'Messaging/Messaging'

import { IPFS } from './IPFS'

const MAX_STORAGE_ATTEMPTS = 20

const L = {
  result: lensProp('result'),
  error: lensProp('error')
}

interface Retry {
  readonly successTime: number
  readonly attempts: number
}

@injectable()
export class ClaimController {
  private readonly logger: Pino.Logger
  private readonly db: Db
  private readonly collection: Collection
  private readonly messaging: Messaging
  private readonly ipfs: IPFS

  constructor(
    @inject('Logger') logger: Pino.Logger,
    @inject('DB') db: Db,
    @inject('Messaging') messaging: Messaging,
    @inject('IPFS') ipfs: IPFS
  ) {
    this.logger = childWithFileName(logger, __filename)
    this.db = db
    this.collection = this.db.collection('storageWriterClaims')
    this.messaging = messaging
    this.ipfs = ipfs
  }

  

  private addClaimToDatabase = (claim: Claim) => this.collection.insertOne({ claim, storageAttempts: 0, ipfsFileHash: null })

  async addClaim(claim: Claim): Promise<void> {
    const logger = this.logger.child({ method: 'addClaim' })

    logger.trace({ claim }, 'Adding Claim')

    await this.addClaimToDatabase(claim)

    logger.info({ claim }, 'Claim Added')
  }

  

  getNextClaimFromDatabase = () => this.collection.findOneAndUpdate({ ipfsFileHash: null, storageAttempts: { $lt: MAX_STORAGE_ATTEMPTS } }, { $inc: { storageAttempts: 1 }, })

  getNextClaim = async () => {
    const logger = this.logger.child({ method: 'create' })

    logger.trace('Getting Claim')

    const response = await this.getNextClaimFromDatabase()

    logger.info({ claim }, 'Claim Stored')

    return claim
  }

  private storeClaimToStorage = (claim: Claim) => this.ipfs.addText(JSON.stringify(claim))

  private async storeClaim(claim: Claim): Promise<{claim: Claim, ipfsFileHash:string}> {
    const logger = this.logger.child({ method: 'create' })

    logger.trace({ claim }, 'Storing Claim')

    const ipfsFileHash = await this.storeClaimToStorage(claim)

    logger.info({ claim, ipfsFileHash }, 'Claim Stored')

    return {
      ipfsFileHash,
      claim
    }
  }

  public storeNextClaim = pipeM(this.getNextClaim, this.storeClaim)
}
