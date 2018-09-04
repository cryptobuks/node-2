import { Claim } from '@po.et/poet-js'

export interface Database {
  addClaim: (claim: Claim) => Promise<void>
  addClaimHash: (claimId: string, claimHash: string) => Promise<void>
  findNextClaim: () => Promise<Claim>
  addError: (error: any) => Promise<void>
  start: () => Promise<void>
}
