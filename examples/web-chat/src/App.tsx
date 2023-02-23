/* eslint no-use-before-define: 0 */
// @ts-ignore
import React, { useEffect, useState } from "react";
import "./App.css";
import handleCommand from "./command";
import Room from "./Room";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import { Decoder } from "@waku/core/lib/message/version_0";
import { PageDirection, LightNode, StoreQueryOptions } from "@waku/interfaces";

import {
  useWaku,
  useFilterMessages,
  useStoreMessages,
  useContentPair,
} from "@waku/react";

export const ChatContentTopic = "/toy-chat/2/huilong/proto";
const startTime = new Date();
// Only retrieve a week of history
startTime.setTime(Date.now() - 1000 * 60 * 60 * 24 * 7);
const endTime = new Date();

const usePersistentNick = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>
] => {
  const [nick, setNick] = useState<string>(() => {
    const persistedNick = window.localStorage.getItem("nick");
    return persistedNick !== null ? persistedNick : generate();
  });
  useEffect(() => {
    localStorage.setItem("nick", nick);
  }, [nick]);

  return [nick, setNick];
};

type UseMessagesParams = {
  node: undefined | LightNode;
  decoder: Decoder;
  options: StoreQueryOptions;
};

const useMessages = (params: UseMessagesParams): Message[] => {
  const { messages: newMessages } = useFilterMessages(params);
  const { messages: storedMessages } = useStoreMessages(params);

  return React.useMemo((): Message[] => {
    return [...storedMessages, ...newMessages]
      .map(Message.fromWakuMessage)
      .filter((v): v is Message => !!v);
  }, [storedMessages, newMessages]);
};

export default function App() {
  const { node } = useWaku<LightNode>();
  const { decoder } = useContentPair(ChatContentTopic);
  const messages = useMessages({
    node,
    decoder,
    options: {
      pageSize: 5,
      pageDirection: PageDirection.FORWARD,
      timeFilter: {
        startTime,
        endTime,
      },
    },
  });

  const [nick, setNick] = usePersistentNick();

  return (
    <div
      className="chat-app"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <Room
        nick={nick}
        messages={messages}
        commandHandler={(input: string) => {
          handleCommand(input, node, setNick).then(({ command, response }) => {
            const commandMessages = response.map((msg) => {
              return Message.fromUtf8String(command, msg);
            });
            console.log("trying to send", commandMessages);
          });
        }}
      />
    </div>
  );
}
