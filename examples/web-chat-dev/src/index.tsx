import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "@livechat/ui-kit";
import { LightNodeProvider, ContentPairProvider } from "@waku/react";

import "./index.css";
import App from "./App";
import { CONTENT_TOPIC, PROTOCOLS } from "./config";
import { NODE_OPTIONS, THEMES } from "./constants";

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
