/* eslint no-use-before-define: 0 */
// @ts-ignore
import React, { useEffect, useReducer, useState } from "react";
import "./App.css";
import handleCommand from "./command";
import Room from "./Room";
import { WakuContext } from "./WakuContext";
import { ThemeProvider } from "@livechat/ui-kit";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import { waitForRemotePeer } from "@waku/core";
import { Protocols, LightNode } from "@waku/interfaces";
import { DecodedMessage, Decoder } from "@waku/core/lib/message/version_0";
import { PageDirection } from "@waku/interfaces";

import { useWaku } from "@waku/react";

const themes = {
  AuthorName: {
    css: {
      fontSize: "1.1em",
    },
  },
  Message: {
    css: {
      margin: "0em",
      padding: "0em",
      fontSize: "0.83em",
    },
  },
  MessageText: {
    css: {
      margin: "0em",
      padding: "0.1em",
      paddingLeft: "1em",
      fontSize: "1.1em",
    },
  },
  MessageGroup: {
    css: {
      margin: "0em",
      padding: "0.2em",
    },
  },
};

export const ChatContentTopic = "/toy-chat/2/huilong/proto";
const ChatDecoder = new Decoder(ChatContentTopic);

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

const useFilterMessages = (waku: undefined | LightNode): Message[] => {
  const [messages, setMessages] = useState<Message[]>([]);

  const appendMessages = (newMessages: Message[]) => {
    if (!newMessages || !newMessages.length) {
      return;
    }

    setMessages((prev) => [...prev, ...newMessages]);
  };

  useEffect(() => {
    if (!waku) return;

    const handleIncomingMessage = (wakuMsg: DecodedMessage) => {
      console.log("Message received: ", wakuMsg);
      const msg = Message.fromWakuMessage(wakuMsg);
      if (msg) {
        appendMessages([msg]);
      }
    };

    let unsubscribe: undefined | (() => Promise<void>);
    waku.filter.subscribe([ChatDecoder], handleIncomingMessage).then(
      (_unsubscribe) => {
        console.log("subscribed to ", ChatContentTopic);
        unsubscribe = _unsubscribe;
      },
      (e) => {
        console.error("Failed to subscribe", e);
      }
    );

    return function cleanUp() {
      if (!waku) return;
      if (typeof unsubscribe === "undefined") return;
      unsubscribe().then(
        () => {
          console.log("unsubscribed to ", ChatContentTopic);
        },
        (e) => console.error("Failed to unsubscribe", e)
      );
    };
  }, [waku]);

  return messages;
};

const useStoreMessages = (waku: undefined | LightNode): Message[] => {
  const [messages, setMessages] = useState<Message[]>([]);

  const appendMessages = (newMessages: Message[]) => {
    if (!newMessages || !newMessages.length) {
      return;
    }

    setMessages((prev) => [...prev, ...newMessages]);
  };

  useEffect(() => {
    if (!waku) return;

    const retrieveMessages = async () => {
      await waitForRemotePeer(waku, [
        Protocols.Store,
        Protocols.Filter,
        Protocols.LightPush,
      ]);
      console.log(`Retrieving archived messages`);

      try {
        const startTime = new Date();
        // Only retrieve a week of history
        startTime.setTime(Date.now() - 1000 * 60 * 60 * 24 * 7);

        const endTime = new Date();

        try {
          for await (const messagesPromises of waku.store.queryGenerator(
            [ChatDecoder],
            {
              pageSize: 5,
              pageDirection: PageDirection.FORWARD,
              timeFilter: {
                startTime,
                endTime,
              },
            }
          )) {
            const wakuMessages = await Promise.all(messagesPromises);

            const messages: Message[] = [];
            wakuMessages
              .filter(isMessageDefined)
              .map((wakuMsg) => Message.fromWakuMessage(wakuMsg))
              .forEach((message) => {
                if (message) {
                  messages.push(message);
                }
              });
            appendMessages(messages);
          }
        } catch (e) {
          console.log("Failed to retrieve messages", e);
        }
      } catch (e) {
        console.log(`Error encountered when retrieving archived messages`, e);
      }
    };

    retrieveMessages();
  }, [waku]);

  return messages;
};

export default function App() {
  const { node: waku } = useWaku<LightNode>();

  const [nick, setNick] = usePersistentNick();

  const msgs = useFilterMessages(waku);
  const messages = useStoreMessages(waku);
  console.log(msgs, messages);

  return (
    <div
      className="chat-app"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <WakuContext.Provider value={{ waku: waku }}>
        <ThemeProvider theme={themes}>
          <Room
            nick={nick}
            messages={[...messages, ...msgs]}
            commandHandler={(input: string) => {
              handleCommand(input, waku, setNick).then(
                ({ command, response }) => {
                  const commandMessages = response.map((msg) => {
                    return Message.fromUtf8String(command, msg);
                  });
                  console.log("trying to send", commandMessages);
                }
              );
            }}
          />
        </ThemeProvider>
      </WakuContext.Provider>
    </div>
  );
}

const isMessageDefined = (
  msg: DecodedMessage | undefined
): msg is DecodedMessage => {
  return !!msg;
};
