export const getProofOfAgeRequest = (params: { maxBirthDate: string }) => ({
  id: 1,
  circuitId: 'credentialAtomicQuerySigV2OnChain',
  optional: false,
  query: {
    allowedIssuers: ['*'],
    type: 'KYCAgeCredential',
    context: 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
    credentialSubject: {
      birthday: {
        $lt: params.maxBirthDate,
      },
    },
  },
})
