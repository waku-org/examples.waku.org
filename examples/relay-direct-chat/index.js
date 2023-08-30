import {
  createRelayNode,
  bytesToUtf8,
  utf8ToBytes,
  createDecoder,
  createEncoder,
} from "@waku/sdk";

import { webSockets } from "@libp2p/websockets";
import { all as filterAll } from "@libp2p/websockets/filters";

import { webRTC } from "@libp2p/webrtc";
import { circuitRelayTransport } from "libp2p/circuit-relay";

const CONTENT_TOPIC = "/toy-chat/2/huilong/proto";

const ui = initUI();
runApp(ui).catch((err) => {
  console.error(err);
  ui.setStatus(`error: ${err.message}`, "error");
});

async function runApp(ui) {
  const {
    info,
    sendMessage,
    unsubscribeFromMessages,
    dial,
    dialWebRTCpeer,
    dropNetworkConnections,
    ensureWebRTCconnectionInRelayMesh,
  } = await initWakuContext({
    ui,
    contentTopic: CONTENT_TOPIC,
  });

  ui.setLocalPeer(info.localPeerId);
  ui.setContentTopic(info.contentTopic);

  ui.onSendMessage(sendMessage);
  ui.onRemoteNodeConnect(dial);
  ui.onWebrtcConnect(dialWebRTCpeer);
  ui.onRelayWebRTC(ensureWebRTCconnectionInRelayMesh);
  ui.onDropNonWebRTC(dropNetworkConnections);

  ui.onExit(async () => {
    ui.setStatus("disconnecting...", "progress");
    await unsubscribeFromMessages();
    ui.setStatus("disconnected", "terminated");
    ui.resetMessages();
  });
}

async function initWakuContext({ ui, contentTopic }) {
  const Decoder = createDecoder(contentTopic);
  const Encoder = createEncoder({ contentTopic });

  const ChatMessage = new protobuf.Type("ChatMessage")
    .add(new protobuf.Field("timestamp", 1, "uint64"))
    .add(new protobuf.Field("nick", 2, "string"))
    .add(new protobuf.Field("text", 3, "bytes"));

  ui.setStatus("starting...", "progress");

  const node = await createRelayNode({
    libp2p: {
      addresses: {
        listen: ["/webrtc"],
      },
      connectionGater: {
        denyDialMultiaddr: () => {
          // refuse to deny localhost addresses
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

  await node.start();

  // Set a filter by using Decoder for a given ContentTopic
  const unsubscribeFromMessages = await node.relay.subscribe(
    [Decoder],
    (wakuMessage) => {
      const messageObj = ChatMessage.decode(wakuMessage.payload);
      ui.renderMessage({
        ...messageObj,
        text: bytesToUtf8(messageObj.text),
      });
    }
  );

  ui.setStatus("started", "success");

  const localPeerId = node.libp2p.peerId.toString();

  const remotePeers = await node.libp2p.peerStore.all();
  const remotePeerIds = new Set(remotePeers.map((peer) => peer.id.toString()));

  ui.setRemotePeer(Array.from(remotePeerIds.keys()));

  node.libp2p.addEventListener("peer:connect", async (event) => {
    remotePeerIds.add(event.detail.toString());
    ui.setRemotePeer(Array.from(remotePeerIds.keys()));
    ui.setRelayMeshInfo(node.relay.gossipSub);
  });

  node.libp2p.addEventListener("peer:disconnect", (event) => {
    remotePeerIds.delete(event.detail.toString());
    ui.setRemotePeer(Array.from(remotePeerIds.keys()));
    ui.setRelayMeshInfo(node.relay.gossipSub);
  });

  node.libp2p.addEventListener("peer:identify", (event) => {
    const peer = event.detail;

    if (!peer.protocols.includes("/webrtc-signaling/0.0.1")) {
      return;
    }

    ui.setWebrtcPeer(peer.peerId.toString());
    ui.setRelayMeshInfo(node.relay.gossipSub);
  });

  window.node = node;

  return {
    unsubscribeFromMessages,
    info: {
      contentTopic,
      localPeerId,
    },
    sendMessage: async ({ text, nick }) => {
      if (!text || !nick) {
        return;
      }

      const protoMessage = ChatMessage.create({
        nick,
        timestamp: Date.now(),
        text: utf8ToBytes(text),
      });

      await node.relay.send(Encoder, {
        payload: ChatMessage.encode(protoMessage).finish(),
      });
    },
    dial: async (multiaddr) => {
      ui.setStatus("connecting...", "progress");
      await node.dial(multiaddr);
      ui.setStatus("connected", "success");
    },
    dialWebRTCpeer: async (peerId) => {
      const peers = await node.libp2p.peerStore.all();
      const circuitPeer = peers.filter(
        (p) =>
          p.protocols.includes("/libp2p/circuit/relay/0.2.0/hop") &&
          p.protocols.includes("/libp2p/circuit/relay/0.2.0/stop")
      )[0];

      if (!circuitPeer) {
        throw Error("No Circuit peer is found");
      }

      let multiaddr = circuitPeer.addresses.pop().multiaddr;
      multiaddr = `${multiaddr}/p2p/${circuitPeer.id.toString()}/p2p-circuit/webrtc/p2p/${peerId}`;

      await node.dial(multiaddr);
      ui.setRelayMeshInfo(node.relay.gossipSub);
    },
    ensureWebRTCconnectionInRelayMesh: async () => {
      const promises = node.libp2p
        .getConnections()
        .filter((c) => c.stat.multiplexer === "/webrtc")
        .map(async (c) => {
          const outboundStream = node.relay.gossipSub.streamsOutbound.get(
            c.remotePeer.toString()
          );
          const isWebRTCOutbound =
            outboundStream.rawStream.constructor.name === "WebRTCStream";

          if (isWebRTCOutbound) {
            return;
          }

          node.relay.gossipSub.streamsOutbound.delete(c.remotePeer.toString());
          await node.relay.gossipSub.createOutboundStream(
            c.remotePeer.toString(),
            c
          );
        });
      await Promise.all(promises);
      ui.setRelayMeshInfo(node.relay.gossipSub);
    },
    dropNetworkConnections: async () => {
      const promises = node.libp2p
        .getConnections()
        .filter((c) => c.stat.multiplexer !== "/webrtc")
        .map(async (c) => {
          const peerId = c.remotePeer.toString();

          node.relay.gossipSub.peers.delete(peerId);
          node.relay.gossipSub.streamsInbound.delete(peerId);
          node.relay.gossipSub.streamsOutbound.delete(peerId);

          await node.libp2p.peerStore.delete(c.remotePeer);
          await c.close();
        });
      await Promise.all(promises);
      ui.setRelayMeshInfo(node.relay.gossipSub);
    },
  };
}

// UI adapter
function initUI() {
  const exitButton = document.getElementById("exit");
  const sendButton = document.getElementById("send");

  const statusBlock = document.getElementById("status");
  const localPeerBlock = document.getElementById("localPeerId");
  const remotePeerId = document.getElementById("remotePeerId");
  const contentTopicBlock = document.getElementById("contentTopic");

  const messagesBlock = document.getElementById("messages");

  const nickText = document.getElementById("nickText");
  const messageText = document.getElementById("messageText");

  const remoteNode = document.getElementById("remoteNode");
  const connectRemoteNode = document.getElementById("connectRemoteNode");

  const webrtcPeer = document.getElementById("webrtcPeer");
  const connectWebrtcPeer = document.getElementById("connectWebrtcPeer");

  const relayWebRTCbutton = document.getElementById("relayWebRTC");
  const dropNonWebRTCbutton = document.getElementById("dropNonWebRTC");

  const relayMeshInfo = document.getElementById("relayMeshInfo");

  return {
    // UI events
    onExit: (cb) => {
      exitButton.addEventListener("click", cb);
    },
    onSendMessage: (cb) => {
      sendButton.addEventListener("click", async () => {
        await cb({
          nick: nickText.value,
          text: messageText.value,
        });
        messageText.value = "";
      });
    },
    // UI renderers
    setStatus: (value, className) => {
      statusBlock.innerHTML = `<span class=${className || ""}>${value}</span>`;
    },
    setLocalPeer: (id) => {
      localPeerBlock.innerText = id.toString();
    },
    setRemotePeer: (ids) => {
      remotePeerId.innerText = ids.join("\n");
    },
    setContentTopic: (topic) => {
      contentTopicBlock.innerText = topic.toString();
    },
    renderMessage: (messageObj) => {
      const { nick, text, timestamp } = messageObj;
      const date = new Date(timestamp);

      // WARNING: XSS vulnerable
      messagesBlock.innerHTML += `
                <div class="message">
                    <p>${nick} <span>(${date.toDateString()})</span>:</p>
                    <p>${text}</p>
                <div>
            `;
    },
    resetMessages: () => {
      messagesBlock.innerHTML = "";
    },
    setWebrtcPeer: (peerId) => {
      webrtcPeer.value = peerId;
    },
    onRemoteNodeConnect: (cb) => {
      connectRemoteNode.addEventListener("click", () => {
        const multiaddr = remoteNode.value;

        if (!multiaddr) {
          throw Error("No multiaddr set to dial");
        }

        cb(multiaddr);
      });
    },
    onWebrtcConnect: (cb) => {
      connectWebrtcPeer.addEventListener("click", () => {
        const multiaddr = webrtcPeer.value;

        if (!multiaddr) {
          throw Error("No multiaddr to dial webrtc");
        }

        cb(multiaddr);
      });
    },
    onRelayWebRTC: (cb) => {
      relayWebRTCbutton.addEventListener("click", cb);
    },
    onDropNonWebRTC: (cb) => {
      dropNonWebRTCbutton.addEventListener("click", cb);
    },
    setRelayMeshInfo: (gossipSub) => {
      relayMeshInfo.innerHTML = "";

      Array.from(gossipSub.peers)
        .map((peerId) => {
          let inbound = gossipSub.streamsInbound.get(peerId);
          inbound = inbound ? inbound.rawStream.constructor.name : "none";

          let outbound = gossipSub.streamsOutbound.get(peerId);
          outbound = outbound ? outbound.rawStream.constructor.name : "none";

          return [peerId, inbound, outbound];
        })
        .map(([peerId, inbound, outbound]) => {
          relayMeshInfo.innerHTML += `${peerId}<br /><b>inbound</b>: ${inbound}\t<b>outbound</b>: ${outbound}`;
          relayMeshInfo.innerHTML += "<br /><br />";
        });
    },
  };
}
