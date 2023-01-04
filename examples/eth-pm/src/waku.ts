import { Dispatch, SetStateAction } from "react";
import type { RelayNode } from "@waku/interfaces";
import { Protocols } from "@waku/interfaces";
import { PrivateMessage, PublicKeyMessage } from "./messaging/wire";
import { validatePublicKeyMessage } from "./crypto";
import { Message } from "./messaging/Messages";
import { equals } from "uint8arrays/equals";
import { waitForRemotePeer } from "@waku/core";
import { createRelayNode } from "@waku/create";
import { bytesToHex, hexToBytes } from "@waku/byte-utils";
import type { DecodedMessage } from "@waku/message-encryption";

export const PublicKeyContentTopic = "/eth-pm/1/public-key/proto";
export const PrivateMessageContentTopic = "/eth-pm/1/private-message/proto";

export async function initWaku(): Promise<RelayNode> {
  const waku = await createRelayNode({ defaultBootstrap: true });
  await waku.start();
  await waitForRemotePeer(waku, [Protocols.Relay]);

  return waku;
}

export function handlePublicKeyMessage(
  myAddress: string | undefined,
  setter: Dispatch<SetStateAction<Map<string, Uint8Array>>>,
  msg: DecodedMessage
) {
  console.log("Public Key Message received:", msg);
  if (!msg.payload) return;
  const publicKeyMsg = PublicKeyMessage.decode(msg.payload);
  if (!publicKeyMsg) return;
  if (myAddress && equals(publicKeyMsg.ethAddress, hexToBytes(myAddress)))
    return;

  const res = validatePublicKeyMessage(publicKeyMsg);
  console.log("Is Public Key Message valid?", res);

  if (res) {
    setter((prevPks: Map<string, Uint8Array>) => {
      prevPks.set(
        bytesToHex(publicKeyMsg.ethAddress),
        publicKeyMsg.encryptionPublicKey
      );
      return new Map(prevPks);
    });
  }
}

export async function handlePrivateMessage(
  setter: Dispatch<SetStateAction<Message[]>>,
  address: string,
  wakuMsg: DecodedMessage
) {
  console.log("Private Message received:", wakuMsg);
  if (!wakuMsg.payload) return;
  const privateMessage = PrivateMessage.decode(wakuMsg.payload);
  if (!privateMessage) {
    console.log("Failed to decode Private Message");
    return;
  }
  if (!equals(privateMessage.toAddress, hexToBytes(address))) return;

  const timestamp = wakuMsg.timestamp ? wakuMsg.timestamp : new Date();

  console.log("Message decrypted:", privateMessage.message);
  setter((prevMsgs: Message[]) => {
    const copy = prevMsgs.slice();
    copy.push({
      text: privateMessage.message,
      timestamp: timestamp,
    });
    return copy;
  });
}
