import type { LightNode } from "@waku/interfaces";
import ChatList from "./ChatList";
import MessageInput from "./MessageInput";
import { useWaku, useContentPair, useLightPush, usePeers } from "@waku/react";
import { TitleBar } from "@livechat/ui-kit";
import { Message } from "./Message";
import { ChatMessage } from "./chat_message";
import { useNodePeers } from "./hooks";
import { useEffect, useState } from "react";
import type { PeerId } from "@libp2p/interface-peer-id";
import { multiaddr } from "@multiformats/multiaddr";

interface Props {
  messages: Message[];
  commandHandler: (cmd: string) => void;
  nick: string;
}

export default function Room(props: Props) {
  const { node } = useWaku<LightNode>();
  const { encoder } = useContentPair();
  const { push: onPush } = useLightPush({ node, encoder });

  const [started, setStarted] = useState(false);

  const { bootstrapPeers, peerExchangePeers } = useNodePeers(node);
  const { storePeers, filterPeers, lightPushPeers } = usePeers({ node });

  const ping = (node: LightNode, peerId: PeerId) => {
    node.libp2p
      // @ts-ignore
      .ping(peerId)
      .then((res) => {
        console.log(`Ping: ${res}`);
      })
      .catch((err) => {
        console.log(`Ping error: ${err}`);
      });
  };

  useEffect(() => {
    if (!node || (!bootstrapPeers && !peerExchangePeers) || started) return;

    // const peerId = Array.from(bootstrapPeers)[0];
    // if (!peerId) return;

    // pings work well and can be interpreted as a good source of checking connectivity with a peer
    // however, the peer:disconnect event is not triggered when we manually go offline

    node.libp2p.connectionManager.addEventListener("peer:disconnect", (cb) => {
      console.log("peer:disconnect", cb);
    });

    // replace with your own node ID to reproduce
    const peerId = multiaddr(
      "/ip4/127.0.0.1/tcp/8002/ws/p2p/16Uiu2HAmHLN5F9M8s8u2ttGU6CYo3qPXA3j5dc9Q2WMsiJRSh46Z"
    );
    console.log("dialing");
    node
      .dial(peerId)
      .then(() => {
        console.log("dialed");
        setInterval(() => {
          // @ts-ignore
          return ping(node, peerId);
        }, 3000);
        setStarted(true);
      })
      .catch((err) => {
        console.log(`Dial error: ${err}`);
      });
  }, [node, bootstrapPeers, peerExchangePeers, started]);

  const onSend = async (text: string) => {
    if (!onPush || !text) {
      return;
    }

    if (text.startsWith("/")) {
      props.commandHandler(text);
    } else {
      const timestamp = new Date();
      const chatMessage = ChatMessage.fromUtf8String(
        timestamp,
        props.nick,
        text
      );
      const payload = chatMessage.encode();

      await onPush({ payload, timestamp });
    }
  };

  const lightPushPeersLength = orZero(lightPushPeers?.length);
  const filterPeersLength = orZero(filterPeers?.length);
  const storePeersLength = orZero(storePeers?.length);

  const peersMessage = `Peers: ${lightPushPeersLength} light push, ${filterPeersLength} filter, ${storePeersLength} store.`;
  const bootstrapPeersMessage = `Bootstrap (DNS Discovery): ${bootstrapPeers.size}, Peer exchange: ${peerExchangePeers.size}. `;

  return (
    <div
      className="chat-container"
      style={{ height: "98vh", display: "flex", flexDirection: "column" }}
    >
      <TitleBar
        leftIcons={[peersMessage]}
        rightIcons={[bootstrapPeersMessage, "View console for more details."]}
        title="Waku v2 chat app"
      />
      <ChatList messages={props.messages} />
      <MessageInput hasLightPushPeers={!!lightPushPeers} sendMessage={onSend} />
    </div>
  );
}

function orZero(value: undefined | number): number {
  return value || 0;
}
