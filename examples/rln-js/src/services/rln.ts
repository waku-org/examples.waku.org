import { ethers } from "ethers";
import {
  create,
  Keystore,
  RLNDecoder,
  RLNEncoder,
  RLNContract,
  SEPOLIA_CONTRACT,
  RLNInstance,
} from "@waku/rln";
import { isBrowserProviderValid } from "@/utils/ethereum";

export enum RLNEventsNames {
  Status = "status",
  Keystore = "keystore",
}

enum StatusEventPayload {
  WASM_LOADING = "WASM Blob download in progress...",
  WASM_FAILED = "Failed to download WASM, check console",
  CONTRACT_LOADING = "Connecting to RLN contract",
  CONTRACT_FAILED = "Failed to connect to RLN contract",
  RLN_INITIALIZED = "RLN dependencies initialized",
  KEYSTORE_LOCAL = "Keystore initialized from localStore",
  KEYSTORE_NEW = "New Keystore was initialized",
}

type EventListener = (event: CustomEvent) => void;

type IRLN = {
  addEventListener: (name: RLNEventsNames, fn: EventListener) => void;
  removeEventListener: (name: RLNEventsNames, fn: EventListener) => void;
};

export class RLN implements IRLN {
  private readonly emitter = new EventTarget();
  private readonly ethProvider: ethers.providers.Web3Provider;

  private rlnInstance: undefined | RLNInstance;
  private rlnContract: undefined | RLNContract;
  private keystore: undefined | Keystore;

  private initialized = false;

  public constructor() {
    const ethereum = (<any>window)
      .ethereum as ethers.providers.ExternalProvider;
    if (!isBrowserProviderValid(ethereum)) {
      throw Error(
        "Invalid Ethereum provider present on the page. Check if MetaMask is connected."
      );
    }
    this.ethProvider = new ethers.providers.Web3Provider(ethereum, "any");
  }

  public async init(): Promise<void> {
    if (this.initialized) {
      console.info("RLN is initialized.");
      return;
    }

    const rlnInstance = await this.initRLNWasm();
    await this.initRLNContract(rlnInstance);

    this.emitStatusEvent(StatusEventPayload.RLN_INITIALIZED);

    this.initKeystore();

    // add keystore initialization
    this.initialized = true;
  }

  private async initRLNWasm(): Promise<RLNInstance> {
    this.emitStatusEvent(StatusEventPayload.WASM_LOADING);
    try {
      this.rlnInstance = await create();
      return this.rlnInstance;
    } catch (error) {
      console.error(
        "Failed at fetching WASM and creating RLN instance: ",
        error
      );
      this.emitStatusEvent(StatusEventPayload.WASM_FAILED);
      throw error;
    }
  }

  private async initRLNContract(rlnInstance: RLNInstance): Promise<void> {
    this.emitStatusEvent(StatusEventPayload.CONTRACT_LOADING);
    try {
      this.rlnContract = await RLNContract.init(rlnInstance, {
        registryAddress: SEPOLIA_CONTRACT.address,
        provider: this.ethProvider.getSigner(),
      });
    } catch (error) {
      console.error("Failed to connect to RLN contract: ", error);
      this.emitStatusEvent(StatusEventPayload.CONTRACT_FAILED);
      throw error;
    }
  }

  private initKeystore(): void {
    const localKeystoreString = localStorage.getItem("keystore");
    const _keystore = Keystore.fromString(localKeystoreString || "");

    if (localKeystoreString) {
      this.emitKeystoreStatusEvent(StatusEventPayload.KEYSTORE_LOCAL);
    } else {
      this.emitKeystoreStatusEvent(StatusEventPayload.KEYSTORE_NEW);
    }

    this.keystore = _keystore || Keystore.create();
  }

  public addEventListener(name: RLNEventsNames, fn: EventListener) {
    return this.emitter.addEventListener(name, fn as any);
  }

  public removeEventListener(name: RLNEventsNames, fn: EventListener) {
    return this.emitter.removeEventListener(name, fn as any);
  }

  private emitStatusEvent(payload: StatusEventPayload) {
    this.emitter.dispatchEvent(
      new CustomEvent(RLNEventsNames.Status, { detail: payload })
    );
  }

  private emitKeystoreStatusEvent(payload: StatusEventPayload) {
    this.emitter.dispatchEvent(
      new CustomEvent(RLNEventsNames.Keystore, { detail: payload })
    );
  }
}
