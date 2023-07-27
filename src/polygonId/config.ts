import { CircuitId, CredentialRequest, EthConnectionConfig, ZeroKnowledgeProofRequest } from '@0xpolygonid/js-sdk'

const RPC_URL = 'https://polygon-mumbai.g.alchemy.com/v2/BI7_GYAO787OflUC7E6DhMJNkhkyq7kp'

export const defaultEthConnectionConfig: EthConnectionConfig = {
  url: RPC_URL,
  defaultGasLimit: 600000,
  minGasPrice: '0',
  maxGasPrice: '100000000000',
  confirmationBlockCount: 5,
  confirmationTimeout: 600000,
  contractAddress: '0x134b1be34911e39a8397ec6289782989729807a4',
  receiptTimeout: 600000,
  rpcResponseTimeout: 5000,
  waitReceiptCycleTime: 30000,
  waitBlockCycleTime: 3000,
  chainId: 80001,
}

const CredentialType: CredentialRequest['type'] = 'KYCAgeCredential'

// request used to verify VC
export const proofReqSig: ZeroKnowledgeProofRequest = {
  id: 1,
  circuitId: CircuitId.AtomicQuerySigV2,
  optional: false,
  query: {
    allowedIssuers: ['*'],
    type: CredentialType,
    context: 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
    credentialSubject: {
      documentType: {
        $eq: 99,
      },
    },
  },
}
