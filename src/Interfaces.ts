import { isClaim, Claim } from '@po.et/poet-js'

export interface ClaimIPFSHashPair {
  readonly claim: Claim
  readonly ipfsFileHash: string
}

export function isClaimIPFSHashPair(o: any): o is ClaimIPFSHashPair {
  return o.claim && isClaim(o.claim) && o.ipfsFileHash
}

export interface ClaimIdIPFSHashPair {
  readonly claimId: string
  readonly ipfsFileHash: string
}

// Interfaces that represent responses by Bitcoin Core's RPC.
// TODO: figure out where to place them

export interface Block {
  hash: string
  confirmations: number
  strippedsize: number
  size: number
  weight: number
  height: number
  version: number
  versionHex: string
  merkleroot: string
  tx: ReadonlyArray<Transaction>
  time: number
  mediantime: number
  nonce: number
  bits: string
  difficulty: string
  chainwork: string
  nTx: number
  previousblockhash: string
  nextblockhash: string
}

export interface Transaction {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  locktime: number
  vin: ReadonlyArray<VIn>
  vout: ReadonlyArray<VOut>
  hex: string
}

export interface VIn {
  sequence: number
  coinbase?: string
  txid?: string
  vout?: number
  scriptSig?: {
    asm: string
    hex: string
  }
}

export interface VOut {
  value: number
  n: number
  scriptPubKey: {
    asm: string
    hex: string
    type: string
    reqSigs: number
    addresses: ReadonlyArray<string>
  }
}