import "@ethersproject/shims";

import React, { useEffect, useState } from "react";
import "./App.css";
import type { RelayNode, IDecoder } from "@waku/interfaces";
import { createDecoder as createSymmetricDecoder } from "@waku/message-encryption/symmetric";
import { createDecoder, DecodedMessage } from "@waku/message-encryption/ecies";
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
  const [waku, setWaku] = useState<RelayNode>();
  const [provider, setProvider] = useState<Web3Provider>();
  const [encryptionKeyPair, setEncryptionKeyPair] = useState<
    KeyPair | undefined
  >();
  const [privateMessageDecoder, setPrivateMessageDecoder] =
    useState<IDecoder<DecodedMessage>>();
  const [publicKeys, setPublicKeys] = useState<Map<string, Uint8Array>>(
    new Map()
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [address, setAddress] = useState<string>();
  const [peerStats, setPeerStats] = useState<{
    relayPeers: number;
  }>({
    relayPeers: 0,
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

    const publicKeyMessageDecoder = createSymmetricDecoder(
      PublicKeyContentTopic,
      PublicKeyMessageEncryptionKey
    );

    let unsubscribe: undefined | (() => Promise<void>);

    waku.relay.subscribe(publicKeyMessageDecoder, observerPublicKeyMessage);

    return function cleanUp() {
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
    if (!encryptionKeyPair) return;

    setPrivateMessageDecoder(
      createDecoder(PrivateMessageContentTopic, encryptionKeyPair.privateKey)
    );
  }, [encryptionKeyPair]);

  useEffect(() => {
    if (!waku) return;
    if (!privateMessageDecoder) return;
    if (!address) return;

    const observerPrivateMessage = handlePrivateMessage.bind(
      {},
      setMessages,
      address
    );

    let unsubscribe: undefined | (() => Promise<void>);

    waku.relay.subscribe(privateMessageDecoder, observerPrivateMessage);

    return function cleanUp() {
      if (typeof unsubscribe === "undefined") return;
      unsubscribe().catch((e) => console.error("Failed to unsubscribe", e));
    };
  }, [waku, address, privateMessageDecoder]);

  useEffect(() => {
    if (!waku) return;

    const interval = setInterval(async () => {
      const peers = waku.relay.gossipSub.getPeers();

      setPeerStats({
        relayPeers: peers.length,
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
              (Relay) Peers: {peerStats.relayPeers}
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
                encryptionKeyPair={encryptionKeyPair}
                waku={waku}
                signer={provider?.getSigner()}
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
