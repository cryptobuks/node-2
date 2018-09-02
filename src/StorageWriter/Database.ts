import { Claim } from '@po.et/poet-js'

export interface Database {
  claimAdd: (claim: Claim) => Promise<void>
  claimAddHash: (claimId: string, claimHash: string) => Promise<void>
  claimFindNext: () => Promise<Claim>
  errorAdd: (error: any) => Promise<void>
  start: () => Promise<void>
}