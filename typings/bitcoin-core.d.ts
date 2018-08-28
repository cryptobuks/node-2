declare module 'bitcoin-core' {
  interface Configuration {
    host?: string
    port?: number
    network?: string
    username?: string
    password?: string
  }

  export default class BitcoinCore {
    constructor(configuration: Configuration)
    listUnspent(): any
    generate(count: number): any
    getBlockchainInfo(): any
    getBalance(): any
    getBlock(hash: string): any
    getBlockHash(height: number): any
  }
}
