import { Claim } from '@po.et/poet-js'
import { lensProp, view, set } from 'ramda'

export interface StoreNextClaimData {
  claim: Claim
  ipfsFileHash?: string
}

const ipfsFileHash = lensProp('ipfsFileHash')
const claim = lensProp('claim')

export const setIPFSFileHash = set(ipfsFileHash)
export const getIPFSFileHash = view(ipfsFileHash)

export const setClaim = set(claim)
export const getClaim = view(claim)
