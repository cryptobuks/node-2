import { Claim } from '@po.et/poet-js'
import { inject, injectable } from 'inversify'
import { Collection, Db, FindAndModifyWriteOpResultObject } from 'mongodb'
import * as Pino from 'pino'
import { pipeP } from 'ramda'

import { childWithFileName } from 'Helpers/Logging'
import { Messaging } from 'Messaging/Messaging'

import { IPFS } from './IPFS'

const MAX_STORAGE_ATTEMPTS = 20

interface ClaimEntry {
  readonly _id: string
  readonly claimId: string
  readonly claim: Claim
  readonly ipfsFileHash: string
  readonly lastStorageAttemptTime: number
  readonly storageAttempts: number
}

enum LogTypes {
  'info' = 'info',
  'trace' = 'trace',
  'error' = 'error',
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

  public readonly addClaim = async (claim: Claim): Promise<void> => {
    const logger = this.logger.child({ method: 'addClaim' })

    logger.trace({ claim }, 'Adding Claim')

    await this.addClaimToDatabase(claim)

    logger.info({ claim }, 'Claim Added')
  }

  private readonly getNextClaimFromDatabase = () =>
    this.collection.findOneAndUpdate(
      { ipfsFileHash: null, storageAttempts: { $lt: MAX_STORAGE_ATTEMPTS } },
      {
        $inc: { storageAttempts: 1 },
        $set: { lastStorageAttemptTime: new Date().getTime() },
      }
    )

  private readonly getResponseValue = (response: FindAndModifyWriteOpResultObject) => Promise.resolve(response.value)

  private readonly getNextClaim = pipeP(
    this.getNextClaimFromDatabase,
    this.getResponseValue
  )

  private readonly addClaimToDatabase = (claim: Claim) =>
    this.collection.insertOne({ claimId: claim.id, claim, storageAttempts: 0, ipfsFileHash: null })

  private readonly storeClaimToStorage = (claim: Claim) => this.ipfs.addText(JSON.stringify(claim))

  private readonly storeClaim = async (
    claimEntry: ClaimEntry
  ): Promise<{ claimEntry: ClaimEntry; ipfsFileHash: string }> => {
    const ipfsFileHash = await this.storeClaimToStorage(claimEntry.claim)

    return {
      ipfsFileHash,
      claimEntry,
    }
  }

  private readonly addIPFSHashByClaimEntryById = (entryId: string, ipfsFileHash: string) =>
    this.collection.findOneAndUpdate({ _id: entryId }, { $set: { ipfsFileHash } })

  private readonly addIPFSHashToClaimEntry = async ({
    claimEntry,
    ipfsFileHash,
  }: {
    claimEntry: ClaimEntry
    ipfsFileHash: string
  }): Promise<{ claim: Claim; ipfsFileHash: string }> => {
    await this.addIPFSHashByClaimEntryById(claimEntry._id, ipfsFileHash)

    return {
      ipfsFileHash,
      claim: claimEntry.claim,
    }
  }

  private readonly log = (level: LogTypes) => (message: string) => async (value: any) => {
    const logger = this.logger
    logger[level]({ value }, message)
    return value
  }

  // tslint:disable-next-line
  public storeNextClaim = pipeP(
    this.log(LogTypes.info)('Finding Claim'),
    this.getNextClaim,
    this.log(LogTypes.info)('Storing Claim'),
    this.storeClaim,
    this.log(LogTypes.info)('Adding IPFS hash to Claim Entry'),
    this.addIPFSHashToClaimEntry,
    this.log(LogTypes.info)('Finished Storing Claim')
  )
}
