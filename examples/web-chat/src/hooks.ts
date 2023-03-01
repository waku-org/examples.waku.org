import React, { useEffect, useState } from "react";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import { Decoder } from "@waku/core/lib/message/version_0";
import { LightNode, StoreQueryOptions } from "@waku/interfaces";

import { useFilterMessages, useStoreMessages } from "@waku/react";

export const usePersistentNick = (): [
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
  decoder: undefined | Decoder;
  options: StoreQueryOptions;
};

type UseMessagesResult = [Message[], (v: Message[]) => void];

export const useMessages = (params: UseMessagesParams): UseMessagesResult => {
  const { messages: newMessages } = useFilterMessages(params);
  const { messages: storedMessages } = useStoreMessages(params);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const pushMessages = (msgs: Message[]) => {
    if (!msgs || !msgs.length) {
      return;
    }
    setLocalMessages((prev) => [...prev, ...msgs]);
  };

  const allMessages = React.useMemo((): Message[] => {
    return [...storedMessages, ...newMessages]
      .map(Message.fromWakuMessage)
      .concat(localMessages)
      .filter((v): v is Message => !!v)
      .filter((v) => v.payloadAsUtf8 !== "")
      .sort(
        (left, right) => left.timestamp.getTime() - right.timestamp.getTime()
      );
  }, [storedMessages, newMessages, localMessages]);

  return [allMessages, pushMessages];
};

// can be safely ignored
// this is for experiments on waku side around new discovery options
export const useNodePeers = (node: undefined | LightNode) => {
  const [bootstrapPeers, setBootstrapPeers] = useState(new Set<string>());
  const [peerExchangePeers, setPeerExchangePeers] = useState(new Set<string>());

  useEffect(() => {
    if (!node) return;

    // Update store peer when new peer connected & identified
    node.libp2p.peerStore.addEventListener("change:protocols", async (evt) => {
      const { peerId } = evt.detail;
      const tags = (await node.libp2p.peerStore.getTags(peerId)).map(
        (t) => t.name
      );
      if (tags.includes("peer-exchange")) {
        setPeerExchangePeers((peers) => new Set(peers).add(peerId.toString()));
      } else {
        setBootstrapPeers((peers) => new Set(peers).add(peerId.toString()));
      }
    });
  }, [node]);

  useEffect(() => {
    console.log("Bootstrap Peers:");
    console.table(bootstrapPeers);

    console.log("Peer Exchange Peers:");
    console.table(peerExchangePeers);
  }, [bootstrapPeers, peerExchangePeers]);

  return {
    bootstrapPeers,
    peerExchangePeers,
  };
};
