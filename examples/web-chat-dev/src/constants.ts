import { wakuDnsDiscovery } from "@waku/dns-discovery";
import { wakuPeerExchangeDiscovery } from "@waku/peer-exchange";

import { ENR_TREE } from "./config";

export const NODE_OPTIONS = {
  libp2p: {
    peerDiscovery: [
      wakuDnsDiscovery(ENR_TREE, {
        store: 1,
        filter: 2,
        lightpush: 2,
      }),
      wakuPeerExchangeDiscovery(),
    ],
  },
};

export const THEMES = {
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
