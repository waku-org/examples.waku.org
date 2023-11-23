import {
  createLightNode,
  createEncoder,
  createDecoder,
  IDecodedMessage,
  LightNode,
  waitForRemotePeer,
} from "@waku/sdk";
import {
  CONTENT_TOPIC,
  ProtoChatMessage,
  ProtoChatMessageType,
} from "@/constants";
import {
  RLNDecoder,
  RLNEncoder,
  IdentityCredential,
  RLNInstance,
  RLNContract,
} from "@waku/rln";
import { RLN } from "@/services/rln";

type InitOptions = {
  membershipID: number;
  credentials: IdentityCredential;
  rln: RLN;
};

export type MessageContent = {
  nick: string;
  text: string;
  time: string;
  proofStatus: string;
};

type SubscribeOptions = {
  rlnContract: RLNContract;
  node: LightNode;
  decoder: RLNDecoder<IDecodedMessage>;
};

export enum WakuEventsNames {
  Status = "status",
  Message = "message",
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

      if (options.rln.rlnContract) {
        await this.subscribeToMessages({
          node: this.node,
          decoder: this.decoder,
          rlnContract: options.rln.rlnContract,
        });
      }
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

  public async sendMessage(nick: string, text: string): Promise<void> {
    if (!this.node || !this.encoder) {
      return;
    }

    const timestamp = new Date();
    const msg = ProtoChatMessage.create({
      text,
      nick,
      timestamp: Math.floor(timestamp.valueOf() / 1000),
    });
    const payload = ProtoChatMessage.encode(msg).finish();
    console.log("Sending message with proof...");

    await this.node.lightPush.send(this.encoder, { payload, timestamp });
    console.log("Message sent!");
  }

  private async subscribeToMessages(options: SubscribeOptions) {
    await options.node.filter.subscribe(options.decoder, (message) => {
      try {
        const { timestamp, nick, text } = ProtoChatMessage.decode(
          message.payload
        ) as unknown as ProtoChatMessageType;

        let proofStatus = "no proof";
        if (message.rateLimitProof) {
          console.log("Proof received: ", message.rateLimitProof);

          try {
            console.time("Proof verification took:");
            const res = message.verify(options.rlnContract.roots());
            console.timeEnd("Proof verification took:");
            proofStatus = res ? "verified" : "not verified";
          } catch (error) {
            proofStatus = "invalid";
            console.error("Failed to verify proof: ", error);
          }
        }

        this.emitMessageEvent({
          nick,
          text,
          proofStatus,
          time: new Date(timestamp).toDateString(),
        });
      } catch (error) {
        console.error("Failed in subscription listener: ", error);
      }
    });
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

  private emitMessageEvent(payload: MessageContent) {
    this.emitter.dispatchEvent(
      new CustomEvent(WakuEventsNames.Message, { detail: payload })
    );
  }
}

export const waku = new Waku();
