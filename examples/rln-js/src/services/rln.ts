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
}

enum StatusEventPayload {
  WASM_LOADING = "WASM Blob download in progress...",
  WASM_FAILED = "Failed to download WASM, check console",
  CONTRACT_LOADING = "Connecting to RLN contract",
  CONTRACT_FAILED = "Failed to connect to RLN contract",
  RLN_INITIALIZED = "RLN dependencies initialized",
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

    this.emitStatusEvent(StatusEventPayload.WASM_LOADING);
    try {
      this.rlnInstance = await create();
    } catch (error) {
      console.error(
        "Failed at fetching WASM and creating RLN instance: ",
        error
      );
      this.emitStatusEvent(StatusEventPayload.WASM_FAILED);
      throw error;
    }

    this.emitStatusEvent(StatusEventPayload.CONTRACT_LOADING);
    try {
      this.rlnContract = await RLNContract.init(this.rlnInstance, {
        registryAddress: SEPOLIA_CONTRACT.address,
        provider: this.ethProvider.getSigner(),
      });
    } catch (error) {
      console.error("Failed to connect to RLN contract: ", error);
      this.emitStatusEvent(StatusEventPayload.CONTRACT_FAILED);
      throw error;
    }

    this.emitStatusEvent(StatusEventPayload.RLN_INITIALIZED);
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
}
