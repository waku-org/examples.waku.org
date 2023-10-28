import {
  createLightNode,
  createEncoder,
  createDecoder,
  IDecodedMessage,
  LightNode,
  waitForRemotePeer,
} from "@waku/sdk";
import { CONTENT_TOPIC } from "@/constants";
import { RLNDecoder, RLNEncoder, IdentityCredential } from "@waku/rln";
import { RLN } from "@/services/rln";

type InitOptions = {
  membershipID: number;
  credentials: IdentityCredential;
  rln: RLN;
};

export enum WakuEventsNames {
  Status = "status",
}

export enum WakuStatusEventPayload {
  INITIALIZING = "Initializing",
  WAITING_FOR_PEERS = "Waiting for peers",
  STARTING = "Starting the node",
  READY = "Ready",
}

type EventListener = (event: CustomEvent) => void;

interface IWaku {
  init: (options: InitOptions) => void;
  initEncoder: (options: InitOptions) => void;
  addEventListener: (name: WakuEventsNames, fn: EventListener) => void;
  removeEventListener: (name: WakuEventsNames, fn: EventListener) => void;
}

export class Waku implements IWaku {
  private contentTopic = CONTENT_TOPIC;
  private readonly emitter = new EventTarget();

  public node: undefined | LightNode;

  private encoder: undefined | RLNEncoder;
  private decoder: undefined | RLNDecoder<IDecodedMessage>;

  private initialized = false;
  private initializing = false;

  constructor() {}

  public async init(options: InitOptions) {
    const { rln } = options;
    if (this.initialized || this.initializing || !options.rln.rlnInstance) {
      return;
    }

    this.initializing = true;

    this.initEncoder(options);
    this.decoder = new RLNDecoder(
      options.rln.rlnInstance,
      createDecoder(this.contentTopic)
    );

    if (!this.node) {
      this.emitStatusEvent(WakuStatusEventPayload.INITIALIZING);
      this.node = await createLightNode({ defaultBootstrap: true });
      this.emitStatusEvent(WakuStatusEventPayload.STARTING);
      await this.node.start();
      this.emitStatusEvent(WakuStatusEventPayload.WAITING_FOR_PEERS);
      await waitForRemotePeer(this.node);
      this.emitStatusEvent(WakuStatusEventPayload.READY);
    }

    this.initialized = true;
    this.initializing = false;
  }

  public initEncoder(options: InitOptions) {
    const { rln, membershipID, credentials } = options;
    if (!rln.rlnInstance) {
      return;
    }

    this.encoder = new RLNEncoder(
      createEncoder({
        ephemeral: false,
        contentTopic: this.contentTopic,
      }),
      rln.rlnInstance,
      membershipID,
      credentials
    );
  }

  public addEventListener(name: WakuEventsNames, fn: EventListener) {
    return this.emitter.addEventListener(name, fn as any);
  }

  public removeEventListener(name: WakuEventsNames, fn: EventListener) {
    return this.emitter.removeEventListener(name, fn as any);
  }

  private emitStatusEvent(payload: WakuStatusEventPayload) {
    this.emitter.dispatchEvent(
      new CustomEvent(WakuEventsNames.Status, { detail: payload })
    );
  }
}

export const waku = new Waku();
