import React from "react";
import ReactDOM from "react-dom";
import { LightNodeProvider, ContentPairProvider } from "@waku/react";
import { wakuDnsDiscovery, enrTree } from "@waku/dns-discovery";
import { wakuPeerExchangeDiscovery } from "@waku/peer-exchange";
import "./index.css";

import App from "./App";
import { CONTENT_TOPIC } from "./config";
import { Protocols } from "@waku/interfaces";

const NODE_OPTIONS = {
  libp2p: {
    peerDiscovery: [
      wakuDnsDiscovery([enrTree.PROD], {
        store: 1,
        filter: 2,
        lightPush: 2,
      }),
      wakuPeerExchangeDiscovery(),
    ],
  },
};

ReactDOM.render(
  <React.StrictMode>
    <LightNodeProvider
      options={NODE_OPTIONS}
      protocols={[
        Protocols.Relay,
        Protocols.Store,
        Protocols.Filter,
        Protocols.LightPush,
      ]}
    >
      <ContentPairProvider contentTopic={CONTENT_TOPIC}>
        <App />
      </ContentPairProvider>
    </LightNodeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
