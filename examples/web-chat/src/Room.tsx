import type { LightNode } from "@waku/interfaces";
import ChatList from "./ChatList";
import MessageInput from "./MessageInput";
import { useWaku, useContentPair, useLightPush } from "@waku/react";
import { Message } from "./Message";
import { ChatMessage } from "./chat_message";
import { useNodePeers, usePeers } from "./hooks";

interface Props {
  messages: Message[];
  commandHandler: (cmd: string) => void;
  nick: string;
}

export default function Room(props: Props) {
  const { node } = useWaku<LightNode>();
  const { encoder } = useContentPair();
  const { push: onPush } = useLightPush({ node, encoder });

  const {
    connectedBootstrapPeers,
    connectedPeerExchangePeers,
    discoveredBootstrapPeers,
    discoveredPeerExchangePeers,
  } = useNodePeers(node);
  const { allConnected, storePeers, filterPeers, lightPushPeers } = usePeers({
    node,
  });

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

  const allConnectedLength = orZero(allConnected?.length);
  const lightPushPeersLength = orZero(lightPushPeers?.length);
  const filterPeersLength = orZero(filterPeers?.length);
  const storePeersLength = orZero(storePeers?.length);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center bg-gray-800 text-white p-4">
        <div>
          <div>Peers Connected: {allConnectedLength}</div>
          <div className="mt-2">Store: {storePeersLength}</div>
          <div>Filter: {filterPeersLength}</div>
          <div>Light Push: {lightPushPeersLength}</div>
        </div>
        <div>Waku v2 Web Chat</div>
        <div>
          <div className="mt-2">
            Peers Discovered:{" "}
            {discoveredBootstrapPeers.size + discoveredPeerExchangePeers.size}
          </div>
          <div>
            Bootstrap: {discoveredBootstrapPeers.size} Peer Exchange:{" "}
            {discoveredPeerExchangePeers.size}
          </div>
          <div className="mt-2">
            Peers Connected:{" "}
            {connectedBootstrapPeers.size + connectedPeerExchangePeers.size}
          </div>
          <div>
            Bootstrap: {connectedBootstrapPeers.size} Peer Exchange:{" "}
            {connectedPeerExchangePeers.size}
          </div>
        </div>
      </div>
      <ChatList messages={props.messages} />
      <MessageInput hasLightPushPeers={!!lightPushPeers} sendMessage={onSend} />
    </div>
  );
}

function orZero(value: undefined | number): number {
  return value || 0;
}
