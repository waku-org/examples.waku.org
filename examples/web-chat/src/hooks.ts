import React, { useEffect, useState } from "react";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import type { Peer } from "@libp2p/interface-peer-store";
import {
  EPeersByDiscoveryEvents,
  LightNode,
  StoreQueryOptions,
  Waku,
} from "@waku/interfaces";
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
  const [discoveredBootstrapPeers, setBootstrapPeers] = useState<Peer[]>([]);
  const [connectedBootstrapPeers, setConnectedBootstrapPeers] = useState<
    Peer[]
  >([]);
  const [discoveredPeerExchangePeers, setPeerExchangePeers] = useState<Peer[]>(
    []
  );
  const [connectedPeerExchangePeers, setConnectedPeerExchangePeers] = useState<
    Peer[]
  >([]);

  useEffect(() => {
    if (!node) return;

    //TODO: remove any once @waku/sdk is updated
    (node as any).connectionManager.addEventListener(
      EPeersByDiscoveryEvents.PEER_DISCOVERY_BOOTSTRAP,
      (event: CustomEvent<Peer>) => {
        setBootstrapPeers((prev) => [...prev, event.detail]);
      }
    );
    (node as any).connectionManager.addEventListener(
      EPeersByDiscoveryEvents.PEER_CONNECT_BOOTSTRAP,
      (event: CustomEvent<Peer>) => {
        setConnectedBootstrapPeers((prev) => [...prev, event.detail]);
      }
    );
    (node as any).connectionManager.addEventListener(
      EPeersByDiscoveryEvents.PEER_DISCOVERY_PEER_EXCHANGE,
      (event: CustomEvent<Peer>) => {
        setPeerExchangePeers((prev) => [...prev, event.detail]);
      }
    );
    (node as any).connectionManager.addEventListener(
      EPeersByDiscoveryEvents.PEER_CONNECT_PEER_EXCHANGE,
      (event: CustomEvent<Peer>) => {
        setConnectedPeerExchangePeers((prev) => [...prev, event.detail]);
      }
    );
  }, [node]);

  return {
    discoveredBootstrapPeers,
    connectedBootstrapPeers,
    discoveredPeerExchangePeers,
    connectedPeerExchangePeers,
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

    const listener = async () => {
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
    node.libp2p.addEventListener("peer:update", listener);
    return () => {
      node.libp2p.removeEventListener("peer:update", listener);
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
