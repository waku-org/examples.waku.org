"use client";

import { waku } from "@/services/waku";
import { CONTENT_TOPIC } from "@/const";
import { encrypt, decrypt } from "ethereum-cryptography/aes";
import { getRandomBytes } from "ethereum-cryptography/random";
import { pbkdf2 } from "ethereum-cryptography/pbkdf2";
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
  kdf:
    | undefined
    | {
        iv: string;
        dklen: number;
        c: number;
        salt: string;
      };
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

  public async createNote(content: string, password?: string): Promise<string> {
    const note = password
      ? await this.encryptNote(content, password)
      : { id: generateRandomString(), content, kdf: undefined };

    await waku.send(this.encoder, {
      payload: utf8ToBytes(JSON.stringify(note)),
    });

    return note.id;
  }

  public async readNote(id: string): Promise<string | undefined> {
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

    if (!message?.kdf) {
      return message?.content;
    }

    const password = window.prompt("This note is encrypted, need password:");

    if (!password) {
      console.log("No password was provided, stopping reading a note.");
      return;
    }

    return this.decryptNote(message, password);
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

  private async encryptNote(content: string, password: string): Promise<Note> {
    const iv = await getRandomBytes(16);
    const salt = await getRandomBytes(32);
    const c = 131072;
    const dklen = 16;
    const kdf = await pbkdf2(
      utf8ToBytes(password.normalize("NFKC")),
      salt,
      c,
      dklen,
      "sha256"
    );
    const encryptedContent = await encrypt(utf8ToBytes(content), kdf, iv);

    return {
      id: generateRandomString(),
      content: bytesToHex(encryptedContent),
      kdf: {
        c,
        dklen,
        iv: bytesToHex(iv),
        salt: bytesToHex(salt),
      },
    };
  }

  private async decryptNote(note: Note, password: string): Promise<string> {
    if (!note?.kdf) {
      throw Error("Failed to decrypt a note, no kdf params found.");
    }

    const iv = hexToBytes(note.kdf.iv);
    const salt = hexToBytes(note.kdf.salt);

    const kdf = await pbkdf2(
      utf8ToBytes(password.normalize("NFKC")),
      salt,
      note.kdf.c,
      note.kdf.dklen,
      "sha256"
    );
    const decryptedContent = await decrypt(hexToBytes(note.content), kdf, iv);

    return bytesToUtf8(decryptedContent);
  }
}

export const notes = new Notes();
