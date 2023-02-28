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
  nick: string;
}

export default function Room(props: Props) {
  const { node } = useWaku<LightNode>();

  const { storePeers, filterPeers, lightPushPeers } = usePeers({ node });
  const { bootstrapPeers, peerExchangePeers } = useNodePeers(node);

  const { encoder } = useContentPair();
  const { push: _sendMessage } = useLightPush({ node, encoder });

  const sendMessage = async (text: string) => {
    if (!_sendMessage) {
      return;
    }

    const timestamp = new Date();
    const chatMessage = ChatMessage.fromUtf8String(timestamp, props.nick, text);
    const payload = chatMessage.encode();

    await _sendMessage({ payload, timestamp });
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
      <MessageInput
        hasLightPushPeers={!!lightPushPeers}
        sendMessage={sendMessage}
      />
    </div>
  );
}

function orZero(value: undefined | number): number {
  return value || 0;
}
