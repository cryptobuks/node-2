import { Claim, ClaimType, createClaim } from '@po.et/poet-js'
import BitcoinCore = require('bitcoin-core')
const url = require('url')
import fetch from 'node-fetch'
import { describe } from 'riteway'
const ipfsAPI = require('ipfs-api')

const waitForNode = (ms = 3000) => new Promise((res, rej) => setTimeout(() => res(), ms))

const ipfsUrl = () => {
  const { hostname, port } = url.parse(process.env.IPFS_URL)
  return [hostname, port]
}

const ipfs = ipfsAPI(ipfsUrl()[0], ipfsUrl()[1], { protocol: 'http' })

const getIPFSFileContents = async (hash: string) => {
  const file = await ipfs.files.cat(hash)
  return JSON.parse(file.toString('utf8'))
}

const privateKey = 'L1mptZyB6aWkiJU7dvAK4UUjLSaqzcRNYJn3KuAA7oEVyiNn3ZPF'
const publicKey = '02cab54b227f16dd4866310799842cdd239f2adb56d0a3789519c6f43a892a61f6'

// TODO: change default to NODE_A_URL
const fullUrl = (host: string = process.env.INTEGRATION_TEST_NODE_URL) => (rest: any) => `${host}${rest}`

const postWork = (claim: Claim) => {
  return fetch(fullUrl()('/works/'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(claim),
  })
}

const getWork = (host: string) => (id: string) => fetch(fullUrl(host)('/works/' + id))
// TODO: make new env vars for each environment: NODE_A_URL, NODE_B_URL
const getWorkFromNodeA = getWork(process.env.INTEGRATION_TEST_NODE_URL)
const getWorkFromNodeB = getWork(process.env.INTEGRATION_TEST_NODE_URL)

describe('submitting a valid claim containing content', async (should: any) => {
  const { assert } = should('')

  const content = 'most readable...'

  // Submit a claim.

  const claim = createClaim(privateKey, ClaimType.Work, {
    name: 'Author Name',
    content,
  })
  const actual = await postWork(claim)

  assert({
    given: 'a valid claim containing the data to be anchored',
    should: 'create the claim',
    actual: actual.ok,
    expected: true,
  })

  // Necessary at this time. Server side events could help.
  await waitForNode(3000)

  const response = await getWorkFromNodeA(claim.id)
  const data = await response.json()

  const {
    timestamp: { ipfsFileHash },
  } = data

  assert({
    given: 'an claim retrieved by id from nodeA',
    should: 'have an IPFS hash',
    actual: !!ipfsFileHash,
    expected: true,
  })

  // mine blocks = confirmation blocks in environment "A".

  assert({
    given: 'a claim id',
    should: 'find the claim in the blockchain',
    actual: false,
    expected: true,
  })

  // mine 1 block in environment "B" to sync blockchain between bitcoinds?
  // BitcoinCore.generate(1)

  // Verify claim is known by node B
  {
    // TODO: Change this to getWorkFromNodeB().
    const response = await getWorkFromNodeA(claim.id)
    const data = await response.json()

    const {
      timestamp: { ipfsFileHash },
    } = data

    assert({
      given: 'an claim retrieved by id from nodeB',
      should: 'have an IPFS hash',
      actual: !!ipfsFileHash,
      expected: true,
    })
  }

  // verfy hash exists in IPFS and the claim content matches submitted claim.

  {
    const contents = await getIPFSFileContents(ipfsFileHash)

    // TODO: The dateCreated from claim is not a string so we are using
    //       a hack to coerce them here. Upcoming poet-js version should fix it.
    const actual = {
      ...contents,
      dateCreated: new Date(contents.dateCreated).toUTCString(),
    }
    const expected = {
      ...claim,
      dateCreated: new Date(claim.dateCreated).toUTCString(),
    }

    assert({
      given: 'an ipfs hash',
      should: 'successfully download the file from ipfs',
      actual,
      expected,
    })
  }
})
