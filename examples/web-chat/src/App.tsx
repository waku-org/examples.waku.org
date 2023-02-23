/* eslint no-use-before-define: 0 */
// @ts-ignore
import React, { useEffect, useReducer, useState } from "react";
import "./App.css";
import handleCommand from "./command";
import Room from "./Room";
import { WakuContext } from "./WakuContext";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import { LightNode } from "@waku/interfaces";
import { Decoder } from "@waku/core/lib/message/version_0";
import { PageDirection } from "@waku/interfaces";

import { useWaku, useFilterMessages, useStoreMessages } from "@waku/react";

export const ChatContentTopic = "/toy-chat/2/huilong/proto";
const ChatDecoder = new Decoder(ChatContentTopic);

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

export default function App() {
  const { node } = useWaku<LightNode>();

  const [nick, setNick] = usePersistentNick();

  const { messages } = useFilterMessages({
    node,
    decoder: ChatDecoder,
  });
  const { messages: storeMessages } = useStoreMessages({
    node,
    decoder: ChatDecoder,
    options: {
      pageSize: 5,
      pageDirection: PageDirection.FORWARD,
      timeFilter: {
        startTime,
        endTime,
      },
    },
  });

  console.log(messages, storeMessages);

  return (
    <div
      className="chat-app"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <WakuContext.Provider value={{ waku: node }}>
        <Room
          nick={nick}
          messages={[]}
          commandHandler={(input: string) => {
            handleCommand(input, node, setNick).then(
              ({ command, response }) => {
                const commandMessages = response.map((msg) => {
                  return Message.fromUtf8String(command, msg);
                });
                console.log("trying to send", commandMessages);
              }
            );
          }}
        />
      </WakuContext.Provider>
    </div>
  );
}
