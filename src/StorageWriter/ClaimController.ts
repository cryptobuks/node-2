import { Claim } from '@po.et/poet-js'
import { inject, injectable } from 'inversify'
import * as Pino from 'pino'
import { pipeP, lensPath, view } from 'ramda'
import { StoreNextClaim, setClaim, getClaim, setIPFSFileHash, getIPFSFileHash } from './StoreNextClaim'

import { childWithFileName } from 'Helpers/Logging'

import { IPFS } from './IPFS'
import { Database } from './Database'

enum LogTypes {
  'info' = 'info',
  'trace' = 'trace',
  'error' = 'error',
}

const L = {
  id: lensPath('id'),
  value: lensPath('value')
}

@injectable()
export class ClaimController {
  private readonly logger: Pino.Logger
  private readonly db: Database
  private readonly ipfs: IPFS

  constructor(
    @inject('Logger') logger: Pino.Logger,
    @inject('DB') db: Database,
    @inject('IPFS') ipfs: IPFS
  ) {
    this.logger = childWithFileName(logger, __filename)
    this.ipfs = ipfs
  }

  private readonly log = (level: LogTypes) => (message: string) => async (value: any) => {
    const logger = this.logger
    logger[level]({ value }, message)
    return value
  }

  public readonly addClaim = async (claim: Claim): Promise<void> => {
    const logger = this.logger.child({ method: 'addClaim' })

    logger.trace({ claim }, 'Adding Claim')

    await this.db.claimAdd(claim)

    logger.info({ claim }, 'Claim Added')
  }

  private readonly storeNextClaimGetClaimErrorHandler = async (message: string) => {
    throw new Error('No more claims')
  }

  private readonly storeNextClaimGetClaim = async (): Promise<StoreNextClaim> => {
    const claim = await this.db.claimFindNext().catch(this.storeNextClaimGetClaimErrorHandler)

    return setClaim(claim, {})
  }

  private readonly serializeClaim = async (claim: Claim) => JSON.stringify(claim)

  private readonly storeClaim = (claim: Claim) => pipeP(
    this.serializeClaim,
    this.ipfs.addText
  )

  private storeNextClaimStoreClaimErrorHandler = (claim: Claim) => async (error: Error) => {
    await this.db.errorAdd({ claim, error })
    throw new Error('')
  }

  private readonly storeNextClaimStoreClaim = async (data: StoreNextClaim): Promise<StoreNextClaim> => {
    const ipfsFileHash = await this.storeClaim(getClaim(data)).catch(this.storeNextClaimStoreClaimErrorHandler(getClaim(data)))

    return setIPFSFileHash(ipfsFileHash, data)
  }

  private readonly storeNextClaimAddIPFSHashToClaim = async (data: StoreNextClaim): Promise<StoreNextClaim> => {
    await this.db.claimAddHash(getClaim(data).id, getIPFSFileHash(data))

    return data
  }

  

  // tslint:disable-next-line
  public storeNextClaim = pipeP(
    this.log(LogTypes.trace)('Finding Claim'),
    this.storeNextClaimGetClaim,
    this.log(LogTypes.trace)('Storing Claim'),
    this.storeNextClaimStoreClaim,
    this.log(LogTypes.trace)('Adding IPFS hash to Claim Entry'),
    this.storeNextClaimAddIPFSHashToClaim,
    this.log(LogTypes.trace)('Finished Storing Claim')
  )
}
