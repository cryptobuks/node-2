import { Claim } from '@po.et/poet-js'
import { lensPath, view, set } from 'ramda'

interface StoreNextClaimFlow {
  claim: Claim,
  ipfsFileHash?: string
}

const ipfsFileHash = lensPath('ipfsFileHash')

export const setIPFSFileHash = set(ipfsFileHash)