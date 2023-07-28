import React, { useEffect, useState } from "react";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import type {
  Peer,
} from "@libp2p/interface-peer-store";
import type { LightNode, StoreQueryOptions, Waku } from "@waku/interfaces";
import type { waku } from "@waku/sdk";

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
  decoder: undefined | waku.Decoder;
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

    const listener = async (evt: any) => {
      const { peerId } = evt.detail;
      const tags = Array.from((await node.libp2p.peerStore.get(peerId)).tags.keys());
      if (tags.includes("peer-exchange")) {
        setPeerExchangePeers((peers) => new Set(peers).add(peerId.toString()));
      } else {
        setBootstrapPeers((peers) => new Set(peers).add(peerId.toString()));
      }
    };

    // Update store peer when new peer connected & identified
    node.libp2p.addEventListener("peer:identify", listener);
    return () => {
      node.libp2p.removeEventListener("peer:identify", listener);
    };
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

type UsePeersParams = {
  node: undefined | Waku;
};

type UsePeersResults = {
  storePeers?: undefined | Peer[];
  filterPeers?: undefined | Peer[];
  lightPushPeers?: undefined | Peer[];
};

/**
 * Hook returns map of peers for different protocols.
 * If protocol is not implemented on the node peers are undefined.
 * @example
 * const { storePeers } = usePeers({ node });
 * @param {Waku} params.node - Waku node, if not set then no peers will be returned
 * @returns {Object} map of peers, if some of the protocols is not implemented then undefined
 */
export const usePeers = (params: UsePeersParams): UsePeersResults => {
  const { node } = params;
  const [peers, setPeers] = React.useState<UsePeersResults>({});

  React.useEffect(() => {
    if (!node) {
      return;
    }

    const listener = async (_event?: any) => {
      const peers = await Promise.all([
        handleCatch(node?.store?.peers()),
        handleCatch(node?.filter?.peers()),
        handleCatch(node?.lightPush?.peers()),
      ]);

      setPeers({
        storePeers: peers[0],
        filterPeers: peers[1],
        lightPushPeers: peers[2],
      });
    };

    listener(); // populate peers before event is invoked
    node.libp2p.addEventListener("peer:identify", listener);
    return () => {
      node.libp2p.removeEventListener("peer:identify", listener);
    };
  }, [node, setPeers]);

  return peers;
};

function handleCatch(promise?: Promise<Peer[]>): Promise<Peer[] | undefined> {
  if (!promise) {
    return Promise.resolve(undefined);
  }

  return promise.catch((_) => {
    return undefined;
  });
}
