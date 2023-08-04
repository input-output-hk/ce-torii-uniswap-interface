import type { Web3Provider } from '@ethersproject/providers'

import { defaultEthConnectionConfig } from './config'
import Storage from './storage'
import { OffChainVerifier, OnChainVerifier } from './verifier'

export class PolygonIdProvider {
  async getOffChainVerifier() {
    const storage = new Storage(defaultEthConnectionConfig)
    await storage.init()
    return new OffChainVerifier(storage.instance())
  }

  async getOnChainVerifier(provider: Web3Provider) {
    const storage = new Storage(defaultEthConnectionConfig)
    await storage.init()
    return new OnChainVerifier(storage.instance(), provider)
  }
}
