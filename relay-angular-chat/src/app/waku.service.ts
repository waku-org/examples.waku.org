import { Injectable } from "@angular/core";
import { Waku } from "js-waku";
import { BehaviorSubject, Subject } from "rxjs";
import { createWaku } from "js-waku/lib/create_waku";
import { waitForRemotePeer } from "js-waku/lib/wait_for_remote_peer";

@Injectable({
  providedIn: "root",
})
export class WakuService {
  private wakuSubject = new Subject<Waku>();
  public waku = this.wakuSubject.asObservable();

  private wakuStatusSubject = new BehaviorSubject("");
  public wakuStatus = this.wakuStatusSubject.asObservable();

  constructor() {}

  init() {
    createWaku({ defaultBootstrap: true }).then((waku) => {
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
