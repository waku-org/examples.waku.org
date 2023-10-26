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

enum RLNEventsNames {
  Status = "status",
}

enum StatusEventPayload {
  WASM_LOADING = "WASM Blob download in progress...",
  WASM_FAILED = "Failed to download WASM, check console",
  CONTRACT_LOADING = "Connecting to RLN contract",
  CONTRACT_FAILED = "Failed to connect to RLN contract",
}

type EmitterProps = Pick<EventTarget, "addEventListener"> &
  Pick<EventTarget, "removeEventListener">;
type IRLN = EmitterProps & {};

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
  }

  public addEventListener(
    name: RLNEventsNames,
    fn: EventListenerOrEventListenerObject
  ) {
    return this.emitter.addEventListener(name, fn);
  }

  public removeEventListener(
    name: RLNEventsNames,
    fn: EventListenerOrEventListenerObject
  ) {
    return this.emitter.removeEventListener(name, fn);
  }

  private emitStatusEvent(payload: StatusEventPayload) {
    this.emitter.dispatchEvent(new Event(payload));
  }
}
