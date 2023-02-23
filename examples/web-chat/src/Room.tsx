import type {
  IDecodedMessage as WakuMessage,
  LightNode,
} from "@waku/interfaces";
import ChatList from "./ChatList";
import MessageInput from "./MessageInput";
import { useWaku, useContentPair } from "@waku/react";
import { TitleBar } from "@livechat/ui-kit";
import { Message } from "./Message";
import { ChatMessage } from "./chat_message";
import { useEffect, useState } from "react";
import { Encoder } from "@waku/core/lib/message/version_0";

interface Props {
  messages: Message[];
  commandHandler: (cmd: string) => void;
  nick: string;
}

export default function Room(props: Props) {
  const { node } = useWaku<LightNode>();
  const { encoder } = useContentPair();

  const [storePeers, setStorePeers] = useState(0);
  const [filterPeers, setFilterPeers] = useState(0);
  const [lightPushPeers, setLightPushPeers] = useState(0);

  const [bootstrapPeers, setBootstrapPeers] = useState(new Set<string>());
  const [peerExchangePeers, setPeerExchangePeers] = useState(new Set<string>());

  useEffect(() => {
    if (!node) return;

    // Update store peer when new peer connected & identified
    node.libp2p.peerStore.addEventListener("change:protocols", async (evt) => {
      const { peerId } = evt.detail;
      const tags = (await node.libp2p.peerStore.getTags(peerId)).map(
        (t) => t.name
      );
      if (tags.includes("peer-exchange")) {
        setPeerExchangePeers((peers) => new Set(peers).add(peerId.toString()));
      } else {
        setBootstrapPeers((peers) => new Set(peers).add(peerId.toString()));
      }

      const storePeers = await node.store.peers();
      setStorePeers(storePeers.length);

      const filterPeers = await node.filter.peers();
      setFilterPeers(filterPeers.length);

      const lightPushPeers = await node.lightPush.peers();
      setLightPushPeers(lightPushPeers.length);
    });
  }, [node]);

  useEffect(() => {
    console.log("Bootstrap Peers:");
    console.table(bootstrapPeers);

    console.log("Peer Exchange Peers:");
    console.table(peerExchangePeers);
  }, [bootstrapPeers, peerExchangePeers]);

  return (
    <div
      className="chat-container"
      style={{ height: "98vh", display: "flex", flexDirection: "column" }}
    >
      <TitleBar
        leftIcons={[
          `Peers: ${lightPushPeers} light push, ${filterPeers} filter, ${storePeers} store.`,
        ]}
        rightIcons={[
          `Bootstrap (DNS Discovery): ${bootstrapPeers.size}, Peer exchange: ${peerExchangePeers.size}. `,
          "View console for more details.",
        ]}
        title="Waku v2 chat app"
      />
      <ChatList messages={props.messages} />
      <MessageInput
        sendMessage={
          node
            ? async (messageToSend) => {
                return handleMessage(
                  messageToSend,
                  props.nick,
                  props.commandHandler,
                  async (msg) => {
                    await node.lightPush.push(encoder as Encoder, msg);
                  }
                );
              }
            : undefined
        }
      />
    </div>
  );
}

async function handleMessage(
  message: string,
  nick: string,
  commandHandler: (cmd: string) => void,
  sender: (wakuMsg: Partial<WakuMessage>) => Promise<void>
) {
  if (message.startsWith("/")) {
    commandHandler(message);
  } else {
    const timestamp = new Date();
    const chatMessage = ChatMessage.fromUtf8String(timestamp, nick, message);
    const payload = chatMessage.encode();

    await sender({ payload, timestamp });
  }
}
