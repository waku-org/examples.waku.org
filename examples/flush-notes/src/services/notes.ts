"use client";

import { waku } from "@/services/waku";
import { CONTENT_TOPIC } from "@/const";
import {
  symmetric,
  generateSymmetricKey,
} from "@waku/message-encryption/crypto";
import {
  createDecoder,
  createEncoder,
  Decoder,
  Encoder,
  IDecodedMessage,
  Unsubscribe,
  utf8ToBytes,
  bytesToUtf8,
} from "@waku/sdk";
import { generateRandomString } from "@/utils";
import { bytesToHex, hexToBytes } from "@waku/utils/bytes";

type Note = {
  id: string;
  content: string;
  iv: string;
};

type NoteResult = {
  id: string;
  password?: string;
};

export class Notes {
  private decoder: Decoder;
  private encoder: Encoder;
  private messages: IDecodedMessage[] = [];
  private subscription: undefined | Unsubscribe;

  constructor() {
    this.decoder = createDecoder(CONTENT_TOPIC);
    this.encoder = createEncoder({ contentTopic: CONTENT_TOPIC });
  }

  public async createNote(
    content: string,
    toEncrypt?: boolean
  ): Promise<NoteResult> {
    const symmetricKey = toEncrypt ? generateSymmetricKey() : undefined;
    const note = toEncrypt
      ? await this.encryptNote(content, symmetricKey)
      : { id: generateRandomString(), content, iv: undefined };

    await waku.send(this.encoder, {
      payload: utf8ToBytes(JSON.stringify(note)),
    });

    return {
      id: note.id,
      password: symmetricKey ? bytesToHex(symmetricKey) : undefined,
    };
  }

  public async readNote(
    id: string,
    password?: string
  ): Promise<string | undefined> {
    await this.initMessages();

    const message = this.messages
      .map((m) => {
        try {
          return JSON.parse(bytesToUtf8(m.payload)) as Note;
        } catch (error) {
          console.log("Failed to read message:", error);
        }
      })
      .find((v) => {
        if (v?.id === id) {
          return true;
        }
      });

    if (!message?.iv) {
      return message?.content;
    }

    const passwordReceived =
      password || window.prompt("This note is encrypted, need password:");

    if (!passwordReceived) {
      console.log("No password was provided, stopping reading a note.");
      return;
    }

    return this.decryptNote(message, passwordReceived);
  }

  private async initMessages() {
    if (this.subscription) {
      return;
    }

    this.messages = await waku.getHistory(this.decoder);
    this.subscription = await waku.subscribe(this.decoder, (message) => {
      this.messages.push(message);
    });
  }

  private async encryptNote(
    content: string,
    symmetricKey: Uint8Array
  ): Promise<Note> {
    const iv = symmetric.generateIv();
    const encryptedContent = await symmetric.encrypt(
      iv,
      symmetricKey,
      utf8ToBytes(content)
    );

    return {
      id: generateRandomString(),
      content: bytesToHex(encryptedContent),
      iv: bytesToHex(iv),
    };
  }

  private async decryptNote(note: Note, password: string): Promise<string> {
    if (!note?.iv) {
      throw Error("Failed to decrypt a note, no IV params found.");
    }

    const iv = hexToBytes(note.iv);
    const symmetricKey = hexToBytes(password);
    const decryptedContent = await symmetric.decrypt(
      iv,
      symmetricKey,
      hexToBytes(note.content)
    );

    return bytesToUtf8(decryptedContent);
  }
}

export const notes = new Notes();
