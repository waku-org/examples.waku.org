import "@ethersproject/shims";

import React, { useEffect, useState } from "react";
import "./App.css";
import { Waku } from "js-waku";
import { KeyPair, PublicKeyMessageEncryptionKey } from "./crypto";
import { Message } from "./messaging/Messages";
import "fontsource-roboto";
import { AppBar, IconButton, Toolbar, Typography } from "@material-ui/core";
import KeyPairHandling from "./key_pair_handling/KeyPairHandling";
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
} from "@material-ui/core/styles";
import { teal, purple, green } from "@material-ui/core/colors";
import WifiIcon from "@material-ui/icons/Wifi";
import BroadcastPublicKey from "./BroadcastPublicKey";
import Messaging from "./messaging/Messaging";
import {
  PrivateMessageContentTopic,
  handlePrivateMessage,
  handlePublicKeyMessage,
  initWaku,
  PublicKeyContentTopic,
} from "./waku";
import { Web3Provider } from "@ethersproject/providers/src.ts/web3-provider";
import ConnectWallet from "./ConnectWallet";
import { waku_message } from "js-waku";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: purple[500],
    },
    secondary: {
      main: teal[600],
    },
  },
});

const useStyles = makeStyles({
  root: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  appBar: {
    // height: '200p',
  },
  container: {
    display: "flex",
    flex: 1,
  },
  main: {
    flex: 1,
    margin: "10px",
  },
  wakuStatus: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  peers: {},
});

function App() {
  const [waku, setWaku] = useState<Waku>();
  const [provider, setProvider] = useState<Web3Provider>();
  const [encryptionKeyPair, setEncryptionKeyPair] = useState<
    KeyPair | undefined
  >();
  const [publicKeys, setPublicKeys] = useState<Map<string, Uint8Array>>(
    new Map()
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [address, setAddress] = useState<string>();
  const [peerStats, setPeerStats] = useState<{
    filterPeers: number;
    lightPushPeers: number;
  }>({
    filterPeers: 0,
    lightPushPeers: 0,
  });

  const classes = useStyles();

  // Waku initialization
  useEffect(() => {
    (async () => {
      if (waku) return;

      const _waku = await initWaku();
      console.log("waku: ready");
      setWaku(_waku);
    })().catch((e) => {
      console.error("Failed to initiate Waku", e);
    });
  }, [waku]);

  useEffect(() => {
    if (!waku) return;

    const observerPublicKeyMessage = handlePublicKeyMessage.bind(
      {},
      address,
      setPublicKeys
    );

    let unsubscribe: undefined | (() => Promise<void>);

    waku.filter.addDecryptionKey(PublicKeyMessageEncryptionKey, {
      method: waku_message.DecryptionMethod.Symmetric,
      contentTopics: [PublicKeyContentTopic],
    });
    waku.filter
      .subscribe(observerPublicKeyMessage, [PublicKeyContentTopic])
      .then(
        (_unsubscribe) => {
          console.log("subscribed to ", PublicKeyContentTopic);
          unsubscribe = _unsubscribe;
        },
        (e) => {
          console.error("Failed to subscribe", e);
        }
      );

    return function cleanUp() {
      if (!waku) return;
      waku.filter.deleteDecryptionKey(PublicKeyMessageEncryptionKey);
      if (typeof unsubscribe === "undefined") return;
      unsubscribe().then(
        () => {
          console.log("unsubscribed to ", PublicKeyContentTopic);
        },
        (e) => console.error("Failed to unsubscribe", e)
      );
    };
  }, [waku, address]);

  useEffect(() => {
    if (!waku) return;
    if (!encryptionKeyPair) return;

    waku.filter.addDecryptionKey(encryptionKeyPair.privateKey, {
      method: waku_message.DecryptionMethod.Asymmetric,
      contentTopics: [PrivateMessageContentTopic],
    });

    return function cleanUp() {
      if (!waku) return;
      if (!encryptionKeyPair) return;

      waku.filter.deleteDecryptionKey(encryptionKeyPair.privateKey);
    };
  }, [waku, encryptionKeyPair]);

  useEffect(() => {
    if (!waku) return;
    if (!encryptionKeyPair) return;
    if (!address) return;

    const observerPrivateMessage = handlePrivateMessage.bind(
      {},
      setMessages,
      address
    );

    let unsubscribe: undefined | (() => Promise<void>);

    waku.filter
      .subscribe(observerPrivateMessage, [PrivateMessageContentTopic])
      .then(
        (_unsubscribe) => {
          unsubscribe = _unsubscribe;
        },
        (e) => {
          console.error("Failed to subscribe", e);
        }
      );

    return function cleanUp() {
      if (!waku) return;
      if (typeof unsubscribe === "undefined") return;
      unsubscribe().catch((e) => console.error("Failed to unsubscribe", e));
    };
  }, [waku, address, encryptionKeyPair]);

  useEffect(() => {
    if (!waku) return;

    const interval = setInterval(async () => {
      const lightPushPeers = await waku.store.peers();
      const filterPeers = await waku.filter.peers();

      setPeerStats({
        filterPeers: filterPeers.length,
        lightPushPeers: lightPushPeers.length,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [waku]);

  let addressDisplay = "";
  if (address) {
    addressDisplay =
      address.substr(0, 6) + "..." + address.substr(address.length - 4, 4);
  }

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <AppBar className={classes.appBar} position="static">
          <Toolbar>
            <IconButton
              edge="start"
              className={classes.wakuStatus}
              aria-label="waku-status"
            >
              <WifiIcon
                color={waku ? undefined : "disabled"}
                style={waku ? { color: green[500] } : {}}
              />
            </IconButton>
            <Typography className={classes.peers} aria-label="connected-peers">
              Peers: {peerStats.filterPeers} filter, {peerStats.lightPushPeers}{" "}
              light push
            </Typography>
            <Typography variant="h6" className={classes.title}>
              Ethereum Private Message
            </Typography>
            <Typography>{addressDisplay}</Typography>
          </Toolbar>
        </AppBar>

        <div className={classes.container}>
          <main className={classes.main}>
            <fieldset>
              <legend>Wallet</legend>
              <ConnectWallet
                setAddress={setAddress}
                setProvider={setProvider}
              />
            </fieldset>
            <fieldset>
              <legend>Encryption Key Pair</legend>
              <KeyPairHandling
                encryptionKeyPair={encryptionKeyPair}
                setEncryptionKeyPair={setEncryptionKeyPair}
              />
              <BroadcastPublicKey
                address={address}
                EncryptionKeyPair={encryptionKeyPair}
                waku={waku}
                providerRequest={provider?.provider?.request}
              />
            </fieldset>
            <fieldset>
              <legend>Messaging</legend>
              <Messaging
                recipients={publicKeys}
                waku={waku}
                messages={messages}
              />
            </fieldset>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
