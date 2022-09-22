import { Dispatch, SetStateAction } from "react";
import { Protocols, utils } from "js-waku";
import type { WakuLight, Message as WakuMessage } from "js-waku/lib/interfaces";
import { PrivateMessage, PublicKeyMessage } from "./messaging/wire";
import { validatePublicKeyMessage } from "./crypto";
import { Message } from "./messaging/Messages";
import { equals } from "uint8arrays/equals";
import { PeerDiscoveryStaticPeers } from "js-waku/lib/peer_discovery_static_list";
import {
  getPredefinedBootstrapNodes,
  Fleet,
} from "js-waku/lib/predefined_bootstrap_nodes";
import { waitForRemotePeer } from "js-waku/lib/wait_for_remote_peer";
import { createLightNode } from "js-waku/lib/create_waku";

export const PublicKeyContentTopic = "/eth-pm/1/public-key/proto";
export const PrivateMessageContentTopic = "/eth-pm/1/private-message/proto";

export async function initWaku(): Promise<WakuLight> {
  const waku = await createLightNode({
    libp2p: {
      peerDiscovery: [
        new PeerDiscoveryStaticPeers(getPredefinedBootstrapNodes(Fleet.Test)),
      ],
    },
  });
  await waku.start();
  await waitForRemotePeer(waku, [Protocols.Filter, Protocols.LightPush]);

  return waku;
}

export function handlePublicKeyMessage(
  myAddress: string | undefined,
  setter: Dispatch<SetStateAction<Map<string, Uint8Array>>>,
  msg: WakuMessage
) {
  console.log("Public Key Message received:", msg);
  if (!msg.payload) return;
  const publicKeyMsg = PublicKeyMessage.decode(msg.payload);
  if (!publicKeyMsg) return;
  if (myAddress && equals(publicKeyMsg.ethAddress, utils.hexToBytes(myAddress)))
    return;

  const res = validatePublicKeyMessage(publicKeyMsg);
  console.log("Is Public Key Message valid?", res);

  if (res) {
    setter((prevPks: Map<string, Uint8Array>) => {
      prevPks.set(
        utils.bytesToHex(publicKeyMsg.ethAddress),
        publicKeyMsg.encryptionPublicKey
      );
      return new Map(prevPks);
    });
  }
}

export async function handlePrivateMessage(
  setter: Dispatch<SetStateAction<Message[]>>,
  address: string,
  wakuMsg: WakuMessage
) {
  console.log("Private Message received:", wakuMsg);
  if (!wakuMsg.payload) return;
  const privateMessage = PrivateMessage.decode(wakuMsg.payload);
  if (!privateMessage) {
    console.log("Failed to decode Private Message");
    return;
  }
  if (!equals(privateMessage.toAddress, utils.hexToBytes(address))) return;

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
