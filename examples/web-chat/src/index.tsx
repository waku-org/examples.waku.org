import React from "react";
import ReactDOM from "react-dom";
import { LightNodeProvider } from "@waku/react";
import { wakuDnsDiscovery } from "@waku/dns-discovery";
import { Protocols } from "@waku/interfaces";
import { wakuPeerExchangeDiscovery } from "@waku/peer-exchange";

import "./index.css";
import App from "./App";

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

const protocols = [Protocols.Filter, Protocols.Store, Protocols.LightPush];

ReactDOM.render(
  <React.StrictMode>
    <LightNodeProvider options={options} protocols={protocols}>
      <App />
    </LightNodeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
