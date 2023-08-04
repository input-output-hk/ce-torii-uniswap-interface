import { CircuitId, ZeroKnowledgeProofRequest, ZeroKnowledgeProofResponse } from '@0xpolygonid/js-sdk'

import { StorageServices } from './storage'

export default class Verifier {
  private storage: StorageServices
  constructor(storage: StorageServices) {
    this.storage = storage
  }

  async verify(zkp: ZeroKnowledgeProofResponse, zkpRequest: ZeroKnowledgeProofRequest): Promise<boolean> {
    try {
      // TODO check that proof matches query, see https://github.com/0xPolygonID/js-sdk/issues/118
      // A dirty workaround until we find a native way to do this in the SDK
      // could be producing a proof with dummy credentials here and extracting the query hash from its raw data
      const sigProofOk = await this.storage.proofService.verifyProof(zkp, zkpRequest.circuitId as CircuitId)
      return sigProofOk
    } catch {
      return false
    }
  }
}
