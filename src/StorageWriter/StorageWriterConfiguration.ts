import { LoggingConfiguration } from 'Configuration'

import { DatabaseMongoConfiguration } from './DatabaseMongo'
import { IPFSConfiguration } from './IPFSConfiguration'
import { ServiceConfiguration } from './ServiceConfiguration'

export interface StorageWriterConfiguration
  extends LoggingConfiguration,
    IPFSConfiguration,
    ServiceConfiguration,
    DatabaseMongoConfiguration {
  readonly ipfsUrl: string
  readonly dbUrl: string
  readonly rabbitmqUrl: string
}
