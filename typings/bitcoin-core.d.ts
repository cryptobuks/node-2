declare module 'bitcoin-core' {
  interface Configuration {
    host?: string
    port?: number
    network?: string
    username?: string
    password?: string
  }

  class BitcoinCore {
    constructor(configuration: Configuration)
    listUnspent(): any
    generate(count: number): any
    getBlockchainInfo(): any
    getBalance(): any
    getBlock(hash: string, verbosity?: number): any
    getBlockHash(height: number): string
    getNewAddress(): Promise<string>
    createRawTransaction(inputs: any, outputs: any): Promise<string>
    signRawTransaction(tx: any): Promise<any>
    sendRawTransaction(tx: any): Promise<any>
  }

  export = BitcoinCore
}
