import { Db, Server } from 'mongodb'
import * as Pino from 'pino'
import { describe } from 'riteway'

import { DatabaseMongo } from './DatabaseMongo'
import { ClaimController } from './ClaimController'
import { IPFS } from './IPFS'
import { IPFSConfiguration } from './IPFSConfiguration'

describe('Storage ClaimController', async (should: any) => {
  const { assert } = should('')

  const host = 'http://localhost'
  const port = 3000
  const server = new Server(host, port)
  const IPFSConfiguration: IPFSConfiguration = {
    ipfsUrl: '',
  }

  {
    const claimController = new ClaimController(
      Pino(),
      new DatabaseMongo(new Db('poet', server)),
      new IPFS(IPFSConfiguration),
    )

    assert({
      given: 'the new instance of ClaimController',
      should: 'be an instance of ClaimController',
      actual: claimController instanceof ClaimController,
      expected: true,
    })
  }
})
