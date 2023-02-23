/* eslint no-use-before-define: 0 */
// @ts-ignore
import React, { useEffect, useState } from "react";
import "./App.css";
import handleCommand from "./command";
import Room from "./Room";
import { Message } from "./Message";
import { PageDirection, LightNode } from "@waku/interfaces";

import { useWaku, useContentPair } from "@waku/react";

import { useMessages, usePersistentNick } from "./hooks";

export const ChatContentTopic = "/toy-chat/2/huilong/proto";
const startTime = new Date();
// Only retrieve a week of history
startTime.setTime(Date.now() - 1000 * 60 * 60 * 24 * 7);
const endTime = new Date();

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
