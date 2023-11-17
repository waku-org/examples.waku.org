"use client";

import { LightNode, createLightNode, waitForRemotePeer } from "@waku/sdk";

type EventListener = (event: CustomEvent) => void;

export enum WakuEvents {
  Status = "status",
}

export class Waku {
  private node: undefined | LightNode;

  private emitter = new EventTarget();
  private initialized: boolean = false;
  private initializing: boolean = false;

  constructor() {}

  public async init(): Promise<void> {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;
    console.log("Waku");
    try {
      this.emitStatusEvent("Initializing...");
      const node = await createLightNode({ defaultBootstrap: true });
      await node.start();
      this.emitStatusEvent("Waiting for peers...");
      await waitForRemotePeer(node);
      this.node = node;
      this.initialized = true;
      this.emitStatusEvent("Connected");
    } catch (error) {
      console.error("Failed to initialize Waku node:", error);
      this.emitStatusEvent("Failed to initialize(see logs)");
    }
    this.initializing = false;
  }

  public addEventListener(event: WakuEvents, fn: EventListener) {
    return this.emitter.addEventListener(event, fn as any);
  }

  public removeEventListener(event: WakuEvents, fn: EventListener) {
    return this.emitter.removeEventListener(event, fn as any);
  }

  private emitStatusEvent(payload: string) {
    console.log(payload);
    this.emitter.dispatchEvent(
      new CustomEvent(WakuEvents.Status, { detail: payload })
    );
  }
}

export const waku = new Waku();
