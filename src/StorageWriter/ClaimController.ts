import { Claim } from '@po.et/poet-js'
import { inject, injectable } from 'inversify'
import * as Pino from 'pino'
import { pipeP, over, set, view } from 'ramda'

import { childWithFileName } from 'Helpers/Logging'

import { Database } from './Database'
import { IPFS } from './IPFS'
import { StoreNextClaimData, L } from './StoreNextClaimData'

enum LogTypes {
  'info' = 'info',
  'trace' = 'trace',
  'error' = 'error',
}

@injectable()
export class ClaimController {
  private readonly logger: Pino.Logger
  private readonly db: Database
  private readonly ipfs: IPFS

  constructor(@inject('Logger') logger: Pino.Logger, @inject('DB') db: Database, @inject('IPFS') ipfs: IPFS) {
    this.logger = childWithFileName(logger, __filename)
    this.ipfs = ipfs
  }

  private readonly log = (level: LogTypes) => (message: string) => async (value: any) => {
    const logger = this.logger
    logger[level]({ value }, message)
    return value
  }

  // tslint:disable-next-line
  public readonly addClaim = async (claim: Claim): Promise<void> => {
    const logger = this.logger.child({ method: 'addClaim' })

    logger.trace({ claim }, 'Adding Claim')

    await this.db.addClaim(claim)

    logger.info({ claim }, 'Claim Added')
  }

  private readonly handleFindNextClaimError = async (error: Error) => {
    throw new Error('No more claims')
  }

  private readonly findNextClaim = async (): Promise<StoreNextClaimData> => {
    try {
      return over(L.claim, this.db.findNextClaim, {})
    } catch (error) {
      await this.handleFindNextClaimError(error)
    }
  }

  private readonly serializeClaim = async (claim: Claim) => JSON.stringify(claim)

  // tslint:disable-next-line
  private readonly uploadClaim = pipeP(
    this.serializeClaim,
    this.ipfs.addText
  )

  private readonly handleStoreClaimError = async (error: Error, claim: Claim) => {
    await this.db.addError({ claim, error })
    throw new Error('Failed to store claim')
  }

  private readonly storeClaim = async (data: StoreNextClaimData): Promise<StoreNextClaimData> => {
    const claim = view(L.claim, data)
    try {
      const ipfsFileHash = await this.uploadClaim(claim)
      return set(L.ipfsFileHash, ipfsFileHash, data)
    } catch (error) {
      await this.handleStoreClaimError(error, claim)
    }
  }

  private readonly handleAddIPFSHashToClaimError = async (error: Error) => {
    throw new Error('Failed to update claim hash')
  }

  private readonly addIPFSHashToClaim = async (data: StoreNextClaimData): Promise<StoreNextClaimData> => {
    try {
      await this.db.addClaimHash(view(L.claimId, data), view(L.ipfsFileHash, data))
      return data
    } catch (error) {
      await this.handleAddIPFSHashToClaimError(error)
    }
  }

  // tslint:disable-next-line
  public storeNextClaim = pipeP(
    this.log(LogTypes.trace)('Finding Claim'),
    this.findNextClaim,
    this.log(LogTypes.trace)('Storing Claim'),
    this.storeClaim,
    this.log(LogTypes.trace)('Adding IPFS hash to Claim Entry'),
    this.addIPFSHashToClaim,
    this.log(LogTypes.trace)('Finished Storing Claim')
  )
}
