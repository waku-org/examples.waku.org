import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { createRelayNode, waitForRemotePeer } from "@waku/sdk";
import type { RelayNode } from "@waku/interfaces";

@Injectable({
  providedIn: "root",
})
export class WakuService {
  private wakuSubject = new Subject<RelayNode>();
  public waku = this.wakuSubject.asObservable();

  private wakuStatusSubject = new BehaviorSubject("");
  public wakuStatus = this.wakuStatusSubject.asObservable();

  constructor() {}

  init() {
    createRelayNode({ defaultBootstrap: true }).then((waku) => {
      waku.start().then(() => {
        this.wakuSubject.next(waku);
        this.wakuStatusSubject.next("Connecting...");

        waitForRemotePeer(waku).then(() => {
          this.wakuStatusSubject.next("Connected");
        });
      });
    });
  }
}
