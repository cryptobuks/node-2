import { LoggingConfiguration } from 'Configuration'

import { IPFSConfiguration } from './IPFSConfiguration'
import { ServiceConfiguration } from './ServiceConfiguration'
import { DatabaseMongoConfiguration } from './DatabaseMongo'

export interface StorageWriterConfiguration extends LoggingConfiguration, IPFSConfiguration, ServiceConfiguration, DatabaseMongoConfiguration {
  readonly ipfsUrl: string
  readonly dbUrl: string
  readonly rabbitmqUrl: string
}
