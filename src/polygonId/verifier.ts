import { CircuitId, ZeroKnowledgeProofRequest, ZeroKnowledgeProofResponse } from '@0xpolygonid/js-sdk'

import { StorageServices } from './storage'

export default class Verifier {
  private storage: StorageServices
  private zkpRequest: ZeroKnowledgeProofRequest
  constructor(storage: StorageServices, zkpRequest: ZeroKnowledgeProofRequest) {
    this.storage = storage
    this.zkpRequest = zkpRequest
  }

  async verify(zkp: ZeroKnowledgeProofResponse): Promise<boolean> {
    try {
      const sigProofOk = await this.storage.proofService.verifyProof(zkp, this.zkpRequest.circuitId as CircuitId)
      return sigProofOk
    } catch {
      return false
    }
  }

  getProofReq(): ZeroKnowledgeProofRequest {
    return this.zkpRequest
  }
}
