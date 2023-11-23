import { ethers } from "ethers";
import {
  create,
  Keystore,
  RLNContract,
  SEPOLIA_CONTRACT,
  RLNInstance,
} from "@waku/rln";
import { isBrowserProviderValid } from "@/utils/ethereum";
import { StatusEventPayload } from "@/constants";

export enum RLNEventsNames {
  Status = "status",
  Keystore = "keystore-changed",
}

type EventListener = (event: CustomEvent) => void;

type IRLN = {
  saveKeystore: () => void;
  addEventListener: (name: RLNEventsNames, fn: EventListener) => void;
  removeEventListener: (name: RLNEventsNames, fn: EventListener) => void;
};

export class RLN implements IRLN {
  private readonly emitter = new EventTarget();
  public readonly ethProvider: ethers.providers.Web3Provider;

  public rlnInstance: undefined | RLNInstance;
  public rlnContract: undefined | RLNContract;
  public keystore: Keystore;

  private initialized = false;
  private initializing = false;

  public constructor() {
    const ethereum =
      window.ethereum as unknown as ethers.providers.ExternalProvider;
    if (!isBrowserProviderValid(ethereum)) {
      throw Error(
        "Invalid Ethereum provider present on the page. Check if MetaMask is connected."
      );
    }
    this.ethProvider = new ethers.providers.Web3Provider(ethereum, "any");
    this.keystore = this.initKeystore();
  }

  public async init(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;
    const rlnInstance = await this.initRLNWasm();
    await this.initRLNContract(rlnInstance);

    this.emitStatusEvent(StatusEventPayload.RLN_INITIALIZED);

    // emit keystore keys once app is ready
    this.emitKeystoreKeys();

    this.initialized = true;
    this.initializing = false;
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

  private initKeystore(): Keystore {
    const localKeystoreString = localStorage.getItem("keystore");
    const _keystore = Keystore.fromString(localKeystoreString || "");

    return _keystore || Keystore.create();
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

  private emitKeystoreKeys() {
    const credentials = Object.keys(this.keystore.toObject().credentials || {});
    this.emitter.dispatchEvent(
      new CustomEvent(RLNEventsNames.Keystore, { detail: credentials })
    );
  }

  public async saveKeystore() {
    localStorage.setItem("keystore", this.keystore.toString());
    this.emitKeystoreKeys();
  }

  public importKeystore(value: string) {
    this.keystore = Keystore.fromString(value) || Keystore.create();
    this.saveKeystore();
  }
}

// Next.js sometimes executes code in server env where there is no window object
export const rln = typeof window === "undefined" ? undefined : new RLN();
