import { Claim } from '@po.et/poet-js'
import { lensProp, lensPath } from 'ramda'

export interface StoreNextClaimData {
  claim: Claim
  ipfsFileHash?: string
}

export const L = {
  claim: lensProp('claim'),
  ipfsFileHash: lensProp('ipfsFileHash'),
  claimId: lensPath(['claim', 'id'])
}