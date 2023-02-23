import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "@livechat/ui-kit";
import { LightNodeProvider } from "@waku/react";
import { wakuDnsDiscovery } from "@waku/dns-discovery";
import { Protocols } from "@waku/interfaces";
import { wakuPeerExchangeDiscovery } from "@waku/peer-exchange";

import "./index.css";
import App from "./App";

const PUBLIC_KEY = "AOGECG2SPND25EEFMAJ5WF3KSGJNSGV356DSTL2YVLLZWIV6SAYBM";
const FQDN = "test.waku.nodes.status.im";
const ENR_TREE = `enrtree://${PUBLIC_KEY}@${FQDN}`;
const NODE_OPTIONS = {
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

const PROTOCOLS = [Protocols.Filter, Protocols.Store, Protocols.LightPush];

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
        <App />
      </LightNodeProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
