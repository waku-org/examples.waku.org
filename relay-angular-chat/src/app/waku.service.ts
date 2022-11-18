import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { createPrivacyNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import type { WakuPrivacy } from "@waku/interfaces";

@Injectable({
  providedIn: "root",
})
export class WakuService {
  private wakuSubject = new Subject<WakuPrivacy>();
  public waku = this.wakuSubject.asObservable();

  private wakuStatusSubject = new BehaviorSubject("");
  public wakuStatus = this.wakuStatusSubject.asObservable();

  constructor() {}

  init() {
    createPrivacyNode({ defaultBootstrap: true }).then((waku) => {
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
