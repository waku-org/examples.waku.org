import { useEffect, useReducer, useState } from "react";
import "./App.css";
import handleCommand from "./command";
import Room from "./Room";
import { WakuContext } from "./WakuContext";
import { ThemeProvider } from "@livechat/ui-kit";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import {
  Fleet,
  getPredefinedBootstrapNodes,
} from "@waku/core/lib/predefined_bootstrap_nodes";
import { waitForRemotePeer } from "@waku/core/lib/wait_for_remote_peer";
import { Protocols, WakuLight } from "@waku/interfaces";
import process from "process";
import { createLightNode } from "@waku/create";
import { DecoderV0, MessageV0 } from "@waku/core/lib/waku_message/version_0";
import { PageDirection } from "@waku/interfaces";
import { bootstrap } from "@libp2p/bootstrap";

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
const ChatDecoder = new DecoderV0(ChatContentTopic);

async function retrieveStoreMessages(
  waku: WakuLight,
  setArchivedMessages: (value: Message[]) => void
): Promise<void> {
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
      setArchivedMessages(messages);
    }
  } catch (e) {
    console.log("Failed to retrieve messages", e);
  }
}

export default function App() {
  const [messages, dispatchMessages] = useReducer(reduceMessages, []);
  const [waku, setWaku] = useState<WakuLight | undefined>(undefined);
  const [nick, setNick] = useState<string>(() => {
    const persistedNick = window.localStorage.getItem("nick");
    return persistedNick !== null ? persistedNick : generate();
  });
  const [historicalMessagesRetrieved, setHistoricalMessagesRetrieved] =
    useState(false);

  useEffect(() => {
    localStorage.setItem("nick", nick);
  }, [nick]);

  useEffect(() => {
    initWaku(setWaku)
      .then(() => console.log("Waku init done"))
      .catch((e) => console.log("Waku init failed ", e));
  }, []);

  useEffect(() => {
    if (!waku) return;
    // Let's retrieve previous messages before listening to new messages
    if (!historicalMessagesRetrieved) return;

    const handleIncomingMessage = (wakuMsg: MessageV0) => {
      console.log("Message received: ", wakuMsg);
      const msg = Message.fromWakuMessage(wakuMsg);
      if (msg) {
        dispatchMessages([msg]);
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
  }, [waku, historicalMessagesRetrieved]);

  useEffect(() => {
    if (!waku) return;
    if (historicalMessagesRetrieved) return;

    const retrieveMessages = async () => {
      await waitForRemotePeer(waku, [
        Protocols.Store,
        Protocols.Filter,
        Protocols.LightPush,
      ]);
      console.log(`Retrieving archived messages`);

      try {
        retrieveStoreMessages(waku, dispatchMessages).then((length) => {
          console.log(`Messages retrieved:`, length);
          setHistoricalMessagesRetrieved(true);
        });
      } catch (e) {
        console.log(`Error encountered when retrieving archived messages`, e);
      }
    };

    retrieveMessages();
  }, [waku, historicalMessagesRetrieved]);

  return (
    <div
      className="chat-app"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <WakuContext.Provider value={{ waku: waku }}>
        <ThemeProvider theme={themes}>
          <Room
            nick={nick}
            messages={messages}
            commandHandler={(input: string) => {
              handleCommand(input, waku, setNick).then(
                ({ command, response }) => {
                  const commandMessages = response.map((msg) => {
                    return Message.fromUtf8String(command, msg);
                  });
                  dispatchMessages(commandMessages);
                }
              );
            }}
          />
        </ThemeProvider>
      </WakuContext.Provider>
    </div>
  );
}

async function initWaku(setter: (waku: WakuLight) => void) {
  try {
    const waku = await createLightNode({
      libp2p: {
        peerDiscovery: [
          bootstrap({ list: getPredefinedBootstrapNodes(selectFleetEnv()) }),
        ],
      },
    });
    await waku.start();

    setter(waku);
  } catch (e) {
    console.log("Issue starting waku ", e);
  }
}

function selectFleetEnv() {
  // Works with react-scripts
  if (process?.env?.NODE_ENV === "development") {
    return Fleet.Test;
  } else {
    return Fleet.Prod;
  }
}

function reduceMessages(state: Message[], newMessages: Message[]) {
  return state.concat(newMessages);
}

const isMessageDefined = (msg: MessageV0 | undefined): msg is MessageV0 => {
  return !!msg;
};
