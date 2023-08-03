import type { PeerId } from "@libp2p/interface-peer-id";
import type { LightNode, StoreQueryOptions, Waku } from "@waku/interfaces";
import type { Decoder } from "@waku/sdk";
import type { Message } from "./Message";

export type UsePeersParams = {
  node: undefined | Waku;
};

export type UsePeersResults = {
  allConnected?: PeerId[];
  storePeers?: PeerId[];
  filterPeers?: PeerId[];
  lightPushPeers?: PeerId[];
};

export type UseMessagesParams = {
  node: undefined | LightNode;
  decoder: undefined | Decoder;
  options: StoreQueryOptions;
};

export type UseMessagesResult = [Message[], (v: Message[]) => void];

export interface ChatListProps {
  messages: Message[];
}

export interface MessageInputProps {
  hasLightPushPeers: boolean;
  sendMessage: ((msg: string) => Promise<void>) | undefined;
}

export interface RoomProps {
  messages: Message[];
  commandHandler: (cmd: string) => void;
  nick: string;
}
