import { Claim } from '@po.et/poet-js'

export const UPLOAD_CLAIM_ERROR = 'UPLOAD_CLAIM_ERROR'

export const uploadClaimError = (message: string, claim: Claim) => ({
  type: UPLOAD_CLAIM_ERROR,
  details: {
    message,
    claim,
  },
})
