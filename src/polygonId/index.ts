import { defaultEthConnectionConfig } from './config'
import Storage from './storage'
import Verifier from './verifier'

export class PolygonIdProvider {
  async getVerifier() {
    const storage = new Storage(defaultEthConnectionConfig)
    await storage.init()
    return new Verifier(storage.instance())
  }
}
