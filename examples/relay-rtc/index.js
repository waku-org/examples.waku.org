import {
  createRelayNode,
  waitForRemotePeer,
  createEncoder,
  createDecoder,
  utf8ToBytes,
  bytesToUtf8,
} from "@waku/sdk";
import { webSockets } from "@libp2p/websockets";
import { all as filterAll } from "@libp2p/websockets/filters";

import { webRTC } from "@libp2p/webrtc";
import { circuitRelayTransport } from "libp2p/circuit-relay";

const peerIdDiv = document.getElementById("peer-id");
const remotePeerIdDiv = document.getElementById("remote-peer-id");
const statusDiv = document.getElementById("status");
const remoteMultiAddrDiv = document.getElementById("remote-multiaddr");
const dialButton = document.getElementById("dial");
const subscribeButton = document.getElementById("subscribe");
const unsubscribeButton = document.getElementById("unsubscribe");
const messagesDiv = document.getElementById("messages");
const textInput = document.getElementById("textInput");
const sendButton = document.getElementById("sendButton");

const ContentTopic = "/js-waku-examples/1/chat/utf8";
const decoder = createDecoder(ContentTopic);
const encoder = createEncoder({ contentTopic: ContentTopic });
let messages = [];
let unsubscribe;

const updateMessages = (msgs, div) => {
  div.innerHTML = "<ul>";
  messages.forEach((msg) => (div.innerHTML += "<li>" + msg + "</li>"));
  div.innerHTML += "</ul>";
};

statusDiv.innerHTML = "<p>Creating Waku node.</p>";
const node = await createRelayNode({
  libp2p: {
    addresses: {
      listen: ["/webrtc"],
    },
    connectionGater: {
      denyDialMultiaddr: () => {
        // by default we refuse to dial local addresses from the browser since they
        // are usually sent by remote peers broadcasting undialable multiaddrs but
        // here we are explicitly connecting to a local node so do not deny dialing
        // any discovered address
        return false;
      },
    },
    transports: [
      webRTC({}),
      circuitRelayTransport({
        discoverRelays: 1,
      }),
      webSockets({ filter: filterAll }),
    ],
  },
});
window.node = node;

statusDiv.innerHTML = "<p>Starting Waku node.</p>";
await node.start();
statusDiv.innerHTML = "<p>Waku node started.</p>";
peerIdDiv.innerHTML = "<p>" + node.libp2p.peerId.toString() + "</p>";
dialButton.disabled = false;

dialButton.onclick = async () => {
  const ma = remoteMultiAddrDiv.value;
  if (!ma) {
    statusDiv.innerHTML = "<p>Error: No multiaddr provided.</p>";
    return;
  }
  statusDiv.innerHTML = "<p>Dialing peer.</p>";
  const multiaddr = MultiformatsMultiaddr.multiaddr(ma);
  await node.dial(multiaddr, ["relay"]);
  await waitForRemotePeer(node, ["relay"]);
  const peers = await node.libp2p.peerStore.all();
  statusDiv.innerHTML = "<p>Peer dialed.</p>";
  remotePeerIdDiv.innerHTML = "<p>" + peers[0].id.toString() + "</p>";
  textInput.disabled = false;
  sendButton.disabled = false;
  subscribeButton.disabled = false;
};

const callback = (wakuMessage) => {
  const text = bytesToUtf8(wakuMessage.payload);
  const timestamp = wakuMessage.timestamp.toString();
  messages.push(text + " - " + timestamp);
  updateMessages(messages, messagesDiv);
};

subscribeButton.onclick = async () => {
  unsubscribe = await node.relay.subscribe([decoder], callback);
  unsubscribeButton.disabled = false;
  subscribeButton.disabled = true;
};

unsubscribeButton.onclick = async () => {
  await unsubscribe();
  unsubscribe = undefined;
  unsubscribeButton.disabled = true;
  subscribeButton.disabled = false;
};

sendButton.onclick = async () => {
  const text = textInput.value;

  await node.relay.send(encoder, {
    payload: utf8ToBytes(text),
  });
  console.log("Message sent!");
  textInput.value = null;
};

const GONODE = "16Uiu2HAmUdyH4P2UhgX3hTCbeeJHpxxfsn8EdyHkMnPyb54a92jZ";
const root = `/ip4/192.168.0.101/tcp/60001/ws/p2p/${GONODE}`;

remoteMultiAddrDiv.value = root;

window.dial = (id) => node.dial(`${root}/p2p-circuit/webrtc/p2p/${id}`);

window.drop = () =>
  Array.from(node.libp2p.components.connectionManager.connections.entries())
    .filter((c) => c[0].toString() === GONODE)
    .map((c) => console.log(c[1][0].close()));
/*
  /ip4/127.0.0.1/tcp/60001/ws/p2p/16Uiu2HAm3s9fFHbcVrKQz2h5fMAsUzm3AeCUxg52e3SBFjt7q4Gg
  /ip4/127.0.0.1/tcp/60001/ws/p2p/16Uiu2HAm3s9fFHbcVrKQz2h5fMAsUzm3AeCUxg52e3SBFjt7q4Gg/p2p-circuit/p2p/12D3KooWMghpY8592CnQQTyg4fiSJcUuA7Pu8n8YzUPYaLjzH7Yo/p2p-circuit/webrtc/p2p/12D3KooWMghpY8592CnQQTyg4fiSJcUuA7Pu8n8YzUPYaLjzH7Yo
  */
