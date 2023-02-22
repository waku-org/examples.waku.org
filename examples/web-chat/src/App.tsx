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
import { wakuDnsDiscovery } from "@waku/dns-discovery";
import { wakuPeerExchangeDiscovery } from "@waku/peer-exchange";
import { waitForRemotePeer } from "@waku/core";
import { Protocols, WakuLight } from "@waku/interfaces";
import { createLightNode } from "@waku/create";
import { DecodedMessage, Decoder } from "@waku/core/lib/message/version_0";
import { PageDirection } from "@waku/interfaces";

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

const useCreateWaku = (options: any): undefined | WakuLight => {
  const [node, setNode] = React.useState<undefined | WakuLight>(undefined);

  React.useEffect(() => {
    Promise.resolve().then(async () => {
      const waku = await createLightNode(options);
      await waku.start();
      await waitForRemotePeer(waku, [
        Protocols.Store,
        Protocols.Filter,
        Protocols.LightPush,
      ]);
      setNode(waku);
    });
  }, []);

  return node;
};

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
  const [messages, dispatchMessages] = useReducer(reduceMessages, []);

  const publicKey = "AOGECG2SPND25EEFMAJ5WF3KSGJNSGV356DSTL2YVLLZWIV6SAYBM";
  const fqdn = "test.waku.nodes.status.im";
  const enrTree = `enrtree://${publicKey}@${fqdn}`;
  const options = {
    libp2p: {
      peerDiscovery: [
        wakuDnsDiscovery(enrTree, {
          store: 1,
          filter: 2,
          lightpush: 2,
        }),
        wakuPeerExchangeDiscovery(),
      ],
    },
  };
  const waku = useCreateWaku(options);

  const [nick, setNick] = usePersistentNick();

  const [historicalMessagesRetrieved, setHistoricalMessagesRetrieved] =
    useState(false);

  // useEffect(() => {
  //   initWaku(setWaku)
  //     .then(() => console.log("Waku init done"))
  //     .catch((e) => console.log("Waku init failed ", e));
  // }, []);

  useEffect(() => {
    if (!waku) return;
    // Let's retrieve previous messages before listening to new messages
    if (!historicalMessagesRetrieved) return;

    const handleIncomingMessage = (wakuMsg: DecodedMessage) => {
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

// async function initWaku(setter: (waku: WakuLight) => void) {
//   try {
//     const publicKey = "AOGECG2SPND25EEFMAJ5WF3KSGJNSGV356DSTL2YVLLZWIV6SAYBM";
//     const fqdn = "test.waku.nodes.status.im";
//     const enrTree = `enrtree://${publicKey}@${fqdn}`;
//     const waku = await createLightNode({
//       libp2p: {
//         peerDiscovery: [
//           wakuDnsDiscovery(enrTree, {
//             store: 1,
//             filter: 2,
//             lightpush: 2,
//           }),
//           wakuPeerExchangeDiscovery(),
//         ],
//       },
//     });
//     await waku.start();
//     await waitForRemotePeer(waku, [
//       Protocols.Store,
//       Protocols.Filter,
//       Protocols.LightPush,
//     ]);

//     setter(waku);
//   } catch (e) {
//     console.log("Issue starting waku ", e);
//   }
// }

function reduceMessages(state: Message[], newMessages: Message[]) {
  return state.concat(newMessages);
}

const isMessageDefined = (
  msg: DecodedMessage | undefined
): msg is DecodedMessage => {
  return !!msg;
};
