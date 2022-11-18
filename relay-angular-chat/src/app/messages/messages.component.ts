import { Component, OnInit } from "@angular/core";
import { WakuService } from "../waku.service";
import type { WakuPrivacy } from "@waku/interfaces";
import protobuf from "protobufjs";
import { DecoderV0, EncoderV0 } from "@waku/core/lib/waku_message/version_0";
import type { MessageV0 } from "@waku/core/lib/waku_message/version_0";

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
  contentTopic: string = `/js-waku-examples/1/chat/proto`;
  decoder: DecoderV0;
  encoder: EncoderV0;
  messages: MessageInterface[] = [];
  messageCount: number = 0;
  waku!: WakuPrivacy;
  wakuStatus!: string;
  deleteObserver?: () => void;

  constructor(private wakuService: WakuService) {
    this.decoder = new DecoderV0(this.contentTopic);
    this.encoder = new EncoderV0(this.contentTopic);
  }

  ngOnInit(): void {
    this.wakuService.wakuStatus.subscribe((wakuStatus) => {
      this.wakuStatus = wakuStatus;
    });

    this.wakuService.waku.subscribe((waku) => {
      this.waku = waku;
      this.deleteObserver = this.waku.relay.addObserver(
        this.decoder,
        this.processIncomingMessages
      );
    });

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  ngOnDestroy(): void {
    if (this.deleteObserver) this.deleteObserver();
  }

  sendMessage(): void {
    const time = new Date().getTime();

    const protoMsg = ProtoChatMessage.create({
      timestamp: time,
      text: `Here is a message #${this.messageCount}`,
    });

    const payload = ProtoChatMessage.encode(protoMsg).finish();
    this.waku.relay.send(this.encoder, { payload }).then(() => {
      console.log(`Message #${this.messageCount} sent`);
      this.messageCount += 1;
    });
  }

  processIncomingMessages = (wakuMessage: MessageV0) => {
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
