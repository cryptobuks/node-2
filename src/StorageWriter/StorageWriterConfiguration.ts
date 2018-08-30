import { LoggingConfiguration } from 'Configuration'

import { IPFSConfiguration } from './IPFSConfiguration'
import { ServiceConfiguration } from './ServiceConfiguration'

export interface StorageWriterConfiguration extends LoggingConfiguration, IPFSConfiguration, ServiceConfiguration {
  readonly ipfsUrl: string
  readonly dbUrl: string
  readonly rabbitmqUrl: string
}
