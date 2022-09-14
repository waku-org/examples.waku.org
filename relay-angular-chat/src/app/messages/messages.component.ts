import { Component, OnInit } from "@angular/core";
import { WakuService } from "../waku.service";
import { WakuMessage } from "js-waku";
import type { WakuPrivacy } from "js-waku/lib/interfaces";
import protobuf from "protobufjs";

const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint32"))
  .add(new protobuf.Field("text", 2, "string"));

interface MessageInterface {
  timestamp: Date;
  text: string;
}

@Component({
  selector: "app-messages",
  templateUrl: "./messages.component.html",
  styleUrls: ["./messages.component.css"],
})
export class MessagesComponent implements OnInit {
  contentTopic: string = `/relay-angular-chat/1/chat/proto`;
  messages: MessageInterface[] = [];
  messageCount: number = 0;
  waku!: WakuPrivacy;
  wakuStatus!: string;

  constructor(private wakuService: WakuService) {}

  ngOnInit(): void {
    this.wakuService.wakuStatus.subscribe((wakuStatus) => {
      this.wakuStatus = wakuStatus;
    });

    this.wakuService.waku.subscribe((waku) => {
      this.waku = waku;
      this.waku.relay.addObserver(this.processIncomingMessages, [
        this.contentTopic,
      ]);
    });

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  ngOnDestroy(): void {
    this.waku.relay.deleteObserver(this.processIncomingMessages, [
      this.contentTopic,
    ]);
  }

  sendMessage(): void {
    const time = new Date().getTime();

    const protoMsg = ProtoChatMessage.create({
      timestamp: time,
      text: `Here is a message #${this.messageCount}`,
    });

    const payload = ProtoChatMessage.encode(protoMsg).finish();

    WakuMessage.fromBytes(payload, this.contentTopic).then((wakuMessage) => {
      this.waku.relay.send(wakuMessage).then(() => {
        console.log(`Message #${this.messageCount} sent`);
        this.messageCount += 1;
      });
    });
  }

  processIncomingMessages = (wakuMessage: WakuMessage) => {
    if (!wakuMessage.payload) return;

    const { text, timestamp } = ProtoChatMessage.decode(
      wakuMessage.payload
    ) as unknown as { text: string; timestamp: bigint };
    const time = new Date();
    time.setTime(Number(timestamp));
    const message = { text, timestamp: time };

    this.messages.push(message);
  };
}
