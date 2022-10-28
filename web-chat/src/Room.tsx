import type { Message as WakuMessage } from "js-waku/lib/interfaces";
import { ChatContentTopic } from "./App";
import ChatList from "./ChatList";
import MessageInput from "./MessageInput";
import { useWaku } from "./WakuContext";
import { TitleBar } from "@livechat/ui-kit";
import { Message } from "./Message";
import { ChatMessage } from "./chat_message";
import { useEffect, useState } from "react";
import { EncoderV0 } from "js-waku/lib/waku_message/version_0";

interface Props {
  messages: Message[];
  commandHandler: (cmd: string) => void;
  nick: string;
}

export default function Room(props: Props) {
  const { waku } = useWaku();

  const [storePeers, setStorePeers] = useState(0);
  const [filterPeers, setFilterPeers] = useState(0);
  const [lightPushPeers, setLightPushPeers] = useState(0);

  const ChatEncoder = new EncoderV0(ChatContentTopic);

  useEffect(() => {
    if (!waku) return;

    // Update store peer when new peer connected & identified
    waku.libp2p.peerStore.addEventListener("change:protocols", async () => {
      const storePeers = await waku.store.peers();
      setStorePeers(storePeers.length);

      const filterPeers = await waku.filter.peers();
      setFilterPeers(filterPeers.length);

      const lightPushPeers = await waku.lightPush.peers();
      setLightPushPeers(lightPushPeers.length);
    });
  }, [waku]);

  return (
    <div
      className="chat-container"
      style={{ height: "98vh", display: "flex", flexDirection: "column" }}
    >
      <TitleBar
        leftIcons={[
          `Peers: ${lightPushPeers} light push, ${filterPeers} filter, ${storePeers} store.`,
        ]}
        title="Waku v2 chat app"
      />
      <ChatList messages={props.messages} />
      <MessageInput
        sendMessage={
          waku
            ? async (messageToSend) => {
                return handleMessage(
                  messageToSend,
                  props.nick,
                  props.commandHandler,
                  async (msg) => {
                    await waku.lightPush.push(ChatEncoder, msg);
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
