import { CircuitId, Operators, ZeroKnowledgeProofRequest, ZeroKnowledgeProofResponse } from '@0xpolygonid/js-sdk'
import { Web3Provider } from '@ethersproject/providers'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ethers, Wallet } from 'ethers'

import ERC20VerifierContractDef from './contracts/ERC20Verifier.json'
import { StorageServices } from './storage'

export class OffChainVerifier {
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

// UTILS copied from:
// https://github.com/0xPolygonID/contracts/blob/main/test/utils/deploy-utils.ts
// when looking on how to construct params from submitZKPResponse
function prepareInputs(zkp: ZeroKnowledgeProofResponse) {
  const { proof, pub_signals } = zkp
  const { pi_a, pi_b, pi_c } = proof
  const [[p1, p2], [p3, p4]] = pi_b
  const preparedProof = {
    pi_a: pi_a.slice(0, 2),
    pi_b: [
      [p2, p1],
      [p4, p3],
    ],
    pi_c: pi_c.slice(0, 2),
  }

  return { inputs: pub_signals, ...preparedProof }
}

export class OnChainVerifier {
  private storage: StorageServices
  private provider: Web3Provider
  constructor(storage: StorageServices, provider: Web3Provider) {
    this.storage = storage
    this.provider = provider
  }

  async verify(zkp: ZeroKnowledgeProofResponse, zkpRequest: ZeroKnowledgeProofRequest): Promise<boolean> {
    const network = await this.provider.getNetwork()
    if (network.chainId !== 80001) {
      // We support on-chain verification only on Mumbai network ATM
      return true
    }

    try {
      const validatorAddress = '0xA59B9E70639B2A4CF51af47f39D14B1E735301Fb'
      const signatureValidatorAddress = '0x55E82C15123C637a6Bbe0EFE1515f7087faC0545'

      // the code below has values hardcoded for the specific proof request
      // returned from getProofOfAgeRequest() helper
      // and will obviously need updating if we were to generalize it to
      // support any other query, e.g. proof of nationality

      // you can run https://go.dev/play/p/rnrRbxXTRY6 to get schema hash and claimPathKey using YOUR schema
      const schemaBigInt = '74977327600848231385663280181476307657'

      // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
      const schemaClaimPathKey = '20376033832371109177683048456014525905119173674985843915445634726167450989630'
      const maxBirthDate = (zkpRequest.query as any)?.credentialSubject?.birthday?.['$lt'] as string | undefined
      if (!maxBirthDate) {
        return false
      }

      const query = {
        schema: schemaBigInt,
        claimPathKey: schemaClaimPathKey,
        operator: Operators.LT, // operator
        value: [parseInt(maxBirthDate, 10), ...new Array(63).fill(0).map(() => 0)], // for operators 1-3 only first value matters
      }

      // in a real DApp, the verifier is of course supposed to run outside the client
      // and it's enough to set/update the request once a day for all users as it is just a query
      // like "prove that you are 21" and the exact user does not matter - that's
      // up to the contract business logic to validate (i.e. that the address giving the proof is the same
      // one as the one sending the tx)
      //
      // beginning of "verifier only" code
      const verifierWallet = new Wallet(
        '0xb1ec2e32cc36652454274d2df3a363304efaf736a9f612bbc8cd6b9530b2aeff',
        this.provider
      )
      console.log(verifierWallet.address)
      const verifierContractAsVerifier = new ethers.Contract(
        validatorAddress,
        ERC20VerifierContractDef.abi,
        verifierWallet
      )
      const setZkpRequestTx = await verifierContractAsVerifier.setZKPRequest(
        zkpRequest.id,
        signatureValidatorAddress,
        query.schema,
        query.claimPathKey,
        query.operator,
        query.value
      )
      await setZkpRequestTx.wait()
      // end of "verifier only" code

      const verifierContractAsUser = new ethers.Contract(
        validatorAddress,
        ERC20VerifierContractDef.abi,
        this.provider.getSigner()
      )
      const { inputs, pi_a, pi_b, pi_c } = prepareInputs(zkp)
      const verificationTx = await verifierContractAsUser.submitZKPResponse(zkpRequest.id, inputs, pi_a, pi_b, pi_c)

      await verificationTx.wait()
      // TODO check that proof matches query, see https://github.com/0xPolygonID/js-sdk/issues/118
      // A dirty workaround until we find a native way to do this in the SDK
      // could be producing a proof with dummy credentials here and extracting the query hash from its raw data
      const sigProofOk = await this.storage.proofService.verifyProof(zkp, zkpRequest.circuitId as CircuitId)
      return sigProofOk
    } catch (e) {
      console.error(e)
      return false
    }
  }
}
