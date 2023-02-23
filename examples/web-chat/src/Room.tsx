import type { LightNode } from "@waku/interfaces";
import ChatList from "./ChatList";
import MessageInput from "./MessageInput";
import { useWaku, useContentPair, useLightPush, usePeers } from "@waku/react";
import { TitleBar } from "@livechat/ui-kit";
import { Message } from "./Message";
import { ChatMessage } from "./chat_message";
import { useNodePeers } from "./hooks";

interface Props {
  messages: Message[];
  commandHandler: (cmd: string) => void;
  nick: string;
}

export default function Room(props: Props) {
  const { node } = useWaku<LightNode>();
  const { encoder } = useContentPair();
  const { push: onPush } = useLightPush({ node, encoder });

  const { bootstrapPeers, peerExchangePeers } = useNodePeers(node);
  const { storePeers, filterPeers, lightPushPeers } = usePeers({ node });

  const onSend = async (text: string) => {
    if (!onPush) {
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

  return (
    <div
      className="chat-container"
      style={{ height: "98vh", display: "flex", flexDirection: "column" }}
    >
      <TitleBar
        leftIcons={[
          `Peers: ${orZero(lightPushPeers?.length)} light push, ${orZero(
            filterPeers?.length
          )} filter, ${orZero(storePeers?.length)} store.`,
        ]}
        rightIcons={[
          `Bootstrap (DNS Discovery): ${bootstrapPeers.size}, Peer exchange: ${peerExchangePeers.size}. `,
          "View console for more details.",
        ]}
        title="Waku v2 chat app"
      />
      <ChatList messages={props.messages} />
      <MessageInput hasPeers={!!lightPushPeers} sendMessage={onSend} />
    </div>
  );
}

function orZero(value: undefined | number): number {
  return value || 0;
}
