import {
  BjjProvider,
  CircuitId,
  CircuitStorage,
  CredentialStatusResolverRegistry,
  CredentialStatusType,
  CredentialStorage,
  CredentialWallet,
  EthConnectionConfig,
  EthStateStorage,
  ICredentialWallet,
  IDataStorage,
  Identity,
  IdentityStorage,
  IdentityWallet,
  IIdentityWallet,
  InMemoryDataSource,
  InMemoryMerkleTreeStorage,
  InMemoryPrivateKeyStore,
  IssuerResolver,
  KMS,
  KmsKeyType,
  OnChainResolver,
  Profile,
  ProofService,
  RHSResolver,
  W3CCredential,
} from '@0xpolygonid/js-sdk'

export interface StorageServices {
  dataStorage: IDataStorage
  credentialWallet: CredentialWallet
  identityWallet: IIdentityWallet
  proofService: ProofService
}

export default class Storage {
  private connectionConfig: EthConnectionConfig
  private services?: StorageServices
  constructor(connectionConfig: EthConnectionConfig) {
    this.connectionConfig = connectionConfig
  }

  async init(): Promise<StorageServices> {
    const dataStorage = this.initDataStorage()
    const credentialWallet = await this.initCredentialWallet(dataStorage)
    const identityWallet = await this.initIdentityWallet(dataStorage, credentialWallet)
    const circuitStorage = await this.initCircuitStorage()
    const proofService = new ProofService(identityWallet, credentialWallet, circuitStorage, dataStorage.states)
    const services = {
      dataStorage,
      credentialWallet,
      identityWallet,
      proofService,
    }
    this.services = services
    return services
  }

  instance(): StorageServices {
    if (!this.services) {
      throw Error('PolygonId storage has not been initialized!')
    }
    return this.services
  }

  private initDataStorage(): IDataStorage {
    const dataStorage = {
      credential: new CredentialStorage(new InMemoryDataSource<W3CCredential>()),
      identity: new IdentityStorage(new InMemoryDataSource<Identity>(), new InMemoryDataSource<Profile>()),
      mt: new InMemoryMerkleTreeStorage(40),

      states: new EthStateStorage(this.connectionConfig),
    }
    return dataStorage
  }

  private async initCredentialWallet(dataStorage: IDataStorage): Promise<CredentialWallet> {
    const resolvers = new CredentialStatusResolverRegistry()
    resolvers.register(CredentialStatusType.SparseMerkleTreeProof, new IssuerResolver())
    resolvers.register(CredentialStatusType.Iden3ReverseSparseMerkleTreeProof, new RHSResolver(dataStorage.states))
    resolvers.register(
      CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
      new OnChainResolver([this.connectionConfig])
    )
    return new CredentialWallet(dataStorage, resolvers)
  }

  private async initIdentityWallet(
    dataStorage: IDataStorage,
    credentialWallet: ICredentialWallet
  ): Promise<IIdentityWallet> {
    const memoryKeyStore = new InMemoryPrivateKeyStore()
    const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, memoryKeyStore)
    const kms = new KMS()
    kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider)

    return new IdentityWallet(kms, dataStorage, credentialWallet)
  }

  private async initCircuitStorage(): Promise<CircuitStorage> {
    const circuitStorage = new CircuitStorage(new InMemoryDataSource())

    const loader = async (path: string) =>
      await fetch(path)
        .then((response) => response.arrayBuffer())
        .then((buffer) => new Uint8Array(buffer))

    await circuitStorage.saveCircuitData(CircuitId.AuthV2, {
      circuitId: CircuitId.AuthV2,
      wasm: await loader(`${CircuitId.AuthV2.toString()}/circuit.wasm`),
      provingKey: await loader(`${CircuitId.AuthV2.toString()}/circuit_final.zkey`),
      verificationKey: await loader(`${CircuitId.AuthV2.toString()}/verification_key.json`),
    })

    await circuitStorage.saveCircuitData(CircuitId.AtomicQuerySigV2, {
      circuitId: CircuitId.AtomicQuerySigV2,
      wasm: await loader(`${CircuitId.AtomicQuerySigV2.toString()}/circuit.wasm`),
      provingKey: await loader(`${CircuitId.AtomicQuerySigV2.toString()}/circuit_final.zkey`),
      verificationKey: await loader(`${CircuitId.AtomicQuerySigV2.toString()}/verification_key.json`),
    })

    await circuitStorage.saveCircuitData(CircuitId.StateTransition, {
      circuitId: CircuitId.StateTransition,
      wasm: await loader(`${CircuitId.StateTransition.toString()}/circuit.wasm`),
      provingKey: await loader(`${CircuitId.StateTransition.toString()}/circuit_final.zkey`),
      verificationKey: await loader(`${CircuitId.StateTransition.toString()}/verification_key.json`),
    })

    await circuitStorage.saveCircuitData(CircuitId.AtomicQueryMTPV2, {
      circuitId: CircuitId.AtomicQueryMTPV2,
      wasm: await loader(`${CircuitId.AtomicQueryMTPV2.toString()}/circuit.wasm`),
      provingKey: await loader(`${CircuitId.AtomicQueryMTPV2.toString()}/circuit_final.zkey`),
      verificationKey: await loader(`${CircuitId.AtomicQueryMTPV2.toString()}/verification_key.json`),
    })
    return circuitStorage
  }
}
