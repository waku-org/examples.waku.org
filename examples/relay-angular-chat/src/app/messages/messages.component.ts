import { Component, OnInit } from "@angular/core";
import { WakuService } from "../waku.service";
import type { RelayNode, Unsubscribe } from "@waku/interfaces";
import protobuf from "protobufjs";
import { waku, createDecoder, createEncoder } from "@waku/sdk";

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
  decoder: waku.Decoder;
  encoder: waku.Encoder;
  messages: MessageInterface[] = [];
  messageCount: number = 0;
  waku!: RelayNode;
  wakuStatus!: string;
  deleteObserver?: Unsubscribe;

  constructor(private wakuService: WakuService) {
    this.decoder = createDecoder(this.contentTopic);
    this.encoder = createEncoder({ contentTopic: this.contentTopic });
  }

  ngOnInit(): void {
    this.wakuService.wakuStatus.subscribe((wakuStatus) => {
      this.wakuStatus = wakuStatus;
    });

    this.wakuService.waku.subscribe((waku) => {
      this.waku = waku;
      this.deleteObserver = this.waku.relay.subscribe(
        this.decoder,
        this.processIncomingMessages
      ) as Unsubscribe;
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

  processIncomingMessages = (wakuMessage: waku.DecodedMessage) => {
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
