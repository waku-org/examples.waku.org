import React from "react";
import ReactDOM from "react-dom";
import { LightNodeProvider, ContentPairProvider } from "@waku/react";
import "./index.css";

import App from "./App";
import { CONTENT_TOPIC } from "./config";
import { Protocols } from "@waku/interfaces";

ReactDOM.render(
  <React.StrictMode>
    <LightNodeProvider
      options={{ defaultBootstrap: true }}
      protocols={[Protocols.Store, Protocols.Filter, Protocols.LightPush]}
    >
      <ContentPairProvider contentTopic={CONTENT_TOPIC}>
        <App />
      </ContentPairProvider>
    </LightNodeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
