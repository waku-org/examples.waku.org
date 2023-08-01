import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "@livechat/ui-kit";
import { LightNodeProvider, ContentPairProvider } from "@waku/react";
import { wakuDnsDiscovery, enrTree } from "@waku/dns-discovery";
import { wakuPeerExchangeDiscovery } from "@waku/peer-exchange";

import "./index.css";
import App from "./App";
import { CONTENT_TOPIC, PROTOCOLS } from "./config";

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

const THEMES = {
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

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={THEMES}>
      <LightNodeProvider options={NODE_OPTIONS} protocols={PROTOCOLS}>
        <ContentPairProvider contentTopic={CONTENT_TOPIC}>
          <App />
        </ContentPairProvider>
      </LightNodeProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
