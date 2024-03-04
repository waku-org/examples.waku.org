"use client";

import { waku } from "@/services/waku";
import { CONTENT_TOPIC } from "@/const";
import {
  createEncoder,
  createDecoder,
  DecodedMessage,
  generateSymmetricKey,
} from "@waku/message-encryption/symmetric";
import { Unsubscribe, utf8ToBytes, bytesToUtf8 } from "@waku/sdk";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";

const UUID_V4_STR_LEN = 8 + 1 + 4 + 1 + 4 + 1 + 4 + 1 + 12; // 8-4-4-4-12 format

type Note = {
  id: string;
  content: string;
};

type NoteResult = {
  id: string;
  key: string;
};

export class Notes {
  private messages: DecodedMessage[] = [];
  private subscription: undefined | Unsubscribe;

  constructor() {}

  public async createNote(content: string): Promise<NoteResult> {
    const symKey = generateSymmetricKey();

    const encoder = createEncoder({ contentTopic: CONTENT_TOPIC, symKey });
    const id = self.crypto.randomUUID();

    if (id.length !== UUID_V4_STR_LEN) {
      throw "Unexpected uuid length";
    }

    await waku.send(encoder, {
      payload: utf8ToBytes(id + content),
    });

    return {
      id,
      key: bytesToHex(symKey),
    };
  }

  public async readNote(id: string, key: string): Promise<string | undefined> {
    await this.initMessages(hexToBytes(key));

    const message = this.messages
      .map((m) => {
        try {
          const str = bytesToUtf8(m.payload);

          const id = str.substring(0, UUID_V4_STR_LEN);
          const content = str.substring(UUID_V4_STR_LEN);

          return { id, content } as Note;
        } catch (error) {
          console.log("Failed to read message:", error);
        }
      })
      .find((v) => {
        if (v?.id === id) {
          return true;
        }
      });

    return message?.content;
  }

  private async initMessages(key: Uint8Array) {
    if (this.subscription) {
      return;
    }

    const decoder = createDecoder(CONTENT_TOPIC, key);

    this.messages = await waku.getHistory(decoder);
    this.subscription = await waku.subscribe(decoder, (message) => {
      this.messages.push(message);
    });
  }
}

export const notes = new Notes();
