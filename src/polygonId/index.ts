import { defaultEthConnectionConfig, proofReqSig } from './config'
import Storage from './storage'
import Verifier from './verifier'

export class PolygonIdProvider {
  private verifier: Verifier | null = null

  async getVerifier() {
    if (!this.verifier) {
      const storage = new Storage(defaultEthConnectionConfig)
      await storage.init()
      const verifier = new Verifier(storage.instance(), proofReqSig)
      this.verifier = verifier
    }
    return this.verifier
  }
}
