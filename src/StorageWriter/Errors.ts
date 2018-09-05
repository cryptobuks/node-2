import { Claim } from '@po.et/poet-js'

export const UPLOAD_CLAIM_ERROR = 'UPLOAD_CLAIM_ERROR'
export const UPDATE_CLAIM_HASH_ERROR = 'UPDATE_CLAIM_HASH_ERROR'

export const uploadClaimError = (message: string, claim: Claim) => ({
  type: UPLOAD_CLAIM_ERROR,
  details: {
    message,
    claim,
  },
})

export const updateClaimHashError = (message: string, claim: Claim, hash: string) => ({
  type: UPDATE_CLAIM_HASH_ERROR,
  details: {
    message,
    claim,
    hash
  },
})
