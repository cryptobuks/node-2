import { Claim } from '@po.et/poet-js'
import { inject, injectable } from 'inversify'
import { Collection, Db } from 'mongodb'
import { lensProp, lensPath, view, isNil, pipeP } from 'ramda'

import { Database } from './Database'

const L = {
  id: lensProp('id'),
  valueClaim: lensPath(['value', 'claim']),
}

const MAX_STORAGE_ATTEMPTS = 10

@injectable()
export class DatabaseMongo implements Database {
  private readonly claims: Collection
  private readonly errors: Collection

  constructor(@inject('DB') db: Db) {
    this.claims = db.collection('storageWriterClaims')
    this.errors = db.collection('storageWriterErrors')
  }

  public readonly start = async () => {
    await this.claims.createIndex({ claimId: 1 }, { unique: true })
  }

  public readonly addError = async (error: object) => {
    await this.errors.insertOne(error)
  }

  public readonly addClaim = async (claim: Claim) => {
    await this.claims.insertOne({ claimId: view(L.id, claim), claim, storageAttempts: 0, ipfsFileHash: null })
  }

  public readonly addClaimHash = async (claimId: string, ipfsFileHash: string) => {
    await this.claims.updateOne({ claimId }, { $set: { ipfsFileHash } })
  }

  private readonly findClaimToStore = async () => {
    const response = await this.claims.findOneAndUpdate(
      {
        $and: [{ ipfsFileHash: null }, { storageAttempts: { $lt: MAX_STORAGE_ATTEMPTS } }],
      },
      {
        $inc: { storageAttempts: 1 },
        $set: { lastStorageAttemptTime: new Date().getTime() },
      }
    )
    return view(L.valueClaim, response)
  }

  private readonly handleNoClaimsFound = async (claim: Claim) => {
    if (isNil(claim)) throw new Error('No claims found')
    return claim
  }

  // tslint:disable-next-line
  public readonly findNextClaim = pipeP(this.findClaimToStore, this.handleNoClaimsFound)
}
