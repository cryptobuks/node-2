import { inject, injectable } from 'inversify'
import { Collection, Db } from 'mongodb'
import { Claim } from '@po.et/poet-js'
import { Database } from './Database'
import { lensProp, view } from 'ramda'

const L = {
  id: lensProp('id'),
  value: lensProp('value')
}

const MAX_STORAGE_ATTEMPTS = 20

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

  public readonly errorAdd = async () => {}

  public readonly claimAdd = async (claim: Claim) => {
    await this.claims.insertOne({ claimId: view(L.id, claim), claim, storageAttempts: 0, ipfsFileHash: null })
  }

  public readonly claimAddHash = async (claimId: string, ipfsFileHash: string) => {
    await this.claims.findOneAndUpdate({ claimId }, { $set: { ipfsFileHash }})
  }

  public readonly claimFindNext = async () => {
    const response = await this.claims.findOneAndUpdate(
      { ipfsFileHash: null, storageAttempts: { $lt: MAX_STORAGE_ATTEMPTS } },
      {
        $inc: { storageAttempts: 1 },
        $set: { lastStorageAttemptTime: new Date().getTime() },
      }
    )
    return view(L.value, response)
  }
  
}
