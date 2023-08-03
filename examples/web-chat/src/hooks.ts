import React, { useEffect, useState } from "react";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import { EPeersByDiscoveryEvents, LightNode, Tags } from "@waku/interfaces";
import type { PeerId } from "@libp2p/interface-peer-id";

import { useFilterMessages, useStoreMessages } from "@waku/react";
import type {
  UseMessagesParams,
  UseMessagesResult,
  UsePeersParams,
  UsePeersResults,
} from "./types";
import { handleCatch } from "./utils";

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
  const [discoveredBootstrapPeers, setBootstrapPeers] = useState<Set<PeerId>>(
    new Set()
  );
  const [connectedBootstrapPeers, setConnectedBootstrapPeers] = useState<
    Set<PeerId>
  >(new Set());
  const [discoveredPeerExchangePeers, setPeerExchangePeers] = useState<
    Set<PeerId>
  >(new Set());
  const [connectedPeerExchangePeers, setConnectedPeerExchangePeers] = useState<
    Set<PeerId>
  >(new Set());

  useEffect(() => {
    if (!node) return;

    const handleDiscoveryBootstrap = (event: CustomEvent<PeerId>) => {
      setBootstrapPeers((peers) => new Set([...peers, event.detail]));
    };

    const handleConnectBootstrap = (event: CustomEvent<PeerId>) => {
      setConnectedBootstrapPeers((peers) => new Set([...peers, event.detail]));
    };

    const handleDiscoveryPeerExchange = (event: CustomEvent<PeerId>) => {
      setPeerExchangePeers((peers) => new Set([...peers, event.detail]));
    };

    const handleConnectPeerExchange = (event: CustomEvent<PeerId>) => {
      setConnectedPeerExchangePeers(
        (peers) => new Set([...peers, event.detail])
      );
    };

    const initHookData = async () => {
      const { CONNECTED, DISCOVERED } =
        await node.connectionManager.getPeersByDiscovery();

      setConnectedBootstrapPeers(
        new Set(CONNECTED[Tags.BOOTSTRAP].map((p) => p.id))
      );
      setConnectedPeerExchangePeers(
        new Set(CONNECTED[Tags.PEER_EXCHANGE].map((p) => p.id))
      );
      setBootstrapPeers(new Set(DISCOVERED[Tags.BOOTSTRAP].map((p) => p.id)));
      setPeerExchangePeers(
        new Set(DISCOVERED[Tags.PEER_EXCHANGE].map((p) => p.id))
      );

      node.connectionManager.addEventListener(
        EPeersByDiscoveryEvents.PEER_DISCOVERY_BOOTSTRAP,
        handleDiscoveryBootstrap
      );
      node.connectionManager.addEventListener(
        EPeersByDiscoveryEvents.PEER_CONNECT_BOOTSTRAP,
        handleConnectBootstrap
      );
      node.connectionManager.addEventListener(
        EPeersByDiscoveryEvents.PEER_DISCOVERY_PEER_EXCHANGE,
        handleDiscoveryPeerExchange
      );
      node.connectionManager.addEventListener(
        EPeersByDiscoveryEvents.PEER_CONNECT_PEER_EXCHANGE,
        handleConnectPeerExchange
      );
    };

    initHookData();

    return () => {
      node.connectionManager.removeEventListener(
        EPeersByDiscoveryEvents.PEER_DISCOVERY_BOOTSTRAP,
        handleDiscoveryBootstrap
      );
      node.connectionManager.removeEventListener(
        EPeersByDiscoveryEvents.PEER_CONNECT_BOOTSTRAP,
        handleConnectBootstrap
      );
      node.connectionManager.removeEventListener(
        EPeersByDiscoveryEvents.PEER_DISCOVERY_PEER_EXCHANGE,
        handleDiscoveryPeerExchange
      );
      node.connectionManager.removeEventListener(
        EPeersByDiscoveryEvents.PEER_CONNECT_PEER_EXCHANGE,
        handleConnectPeerExchange
      );
    };
  }, [node]);

  return {
    discoveredBootstrapPeers,
    connectedBootstrapPeers,
    discoveredPeerExchangePeers,
    connectedPeerExchangePeers,
  };
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

  useEffect(() => {
    if (!node) {
      return;
    }

    const listener = async () => {
      const peers = await Promise.all([
        node?.libp2p.getConnections().map((c) => c.remotePeer),
        handleCatch(node?.store?.peers()),
        handleCatch(node?.filter?.peers()),
        handleCatch(node?.lightPush?.peers()),
      ]);

      setPeers({
        allConnected: peers[0],
        storePeers: peers[1]?.map((p) => p.id),
        filterPeers: peers[2]?.map((p) => p.id),
        lightPushPeers: peers[3]?.map((p) => p.id),
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
