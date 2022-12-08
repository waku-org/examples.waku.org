import * as utils from "https://unpkg.com/@waku/byte-utils@0.0.2/bundle/index.js";
import * as wakuCreate from "https://unpkg.com/@waku/create@0.0.4/bundle/index.js";
import { waitForRemotePeer } from "https://unpkg.com/@waku/core@0.0.6/bundle/lib/wait_for_remote_peer.js";
import * as wakuMessage from "https://unpkg.com/@waku/core@0.0.6/bundle/lib/waku_message/version_0.js";

const MULTI_ADDR = "/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm";
const CONTENT_TOPIC = "/toy-chat/2/huilong/proto";
const PROTOCOLS = ["filter", "lightpush"];

runApp().catch((err) => {
    console.error(err);
});

async function runApp() {
    const ui = initUI();

    ui.setStatus("connecting...");

    const { info, sendMessage, unsubscribeFromMessages } = await initWakuContext({
        protocols: PROTOCOLS,
        multiAddr: MULTI_ADDR,
        contentTopic: CONTENT_TOPIC,
        onMessageReceived: ui.renderMessage,
    });

    ui.setStatus("connected");

    ui.setLocalPeer(info.localPeerId);
    ui.setRemotePeer(info.remotePeerId);
    ui.setRemoteMultiAddr(info.multiAddr);
    ui.setContentTopic(info.contentTopic);

    ui.onSendMessage(sendMessage);

    ui.onExit(() => {
        ui.setStatus("disconnecting...");
        unsubscribeFromMessages().then(() => {
            ui.setStatus("disconnected");
            ui.resetMessages();
        });
    });
}

async function initWakuContext({
    multiAddr,
    protocols,
    contentTopic,
    onMessageReceived,
}) {
    const Decoder = new wakuMessage.DecoderV0(contentTopic);
    const Encoder = new wakuMessage.EncoderV0(contentTopic);

    const ChatMessage = new protobuf.Type("ChatMessage")
        .add(new protobuf.Field("timestamp", 1, "uint64"))
        .add(new protobuf.Field("nick", 2, "string"))
        .add(new protobuf.Field("text", 3, "bytes"));

    const node = await wakuCreate.createLightNode();

    await node.start();

    await node.dial(multiAddr, protocols);
    await waitForRemotePeer(node, protocols);

    // Set a filter by using Decoder for a given ContentTopic
    const unsubscribeFromMessages = await node.filter.subscribe([Decoder], (wakuMessage) => {
        const messageObj = ChatMessage.decode(wakuMessage.payload);
        onMessageReceived({
            ...messageObj,
            text: utils.bytesToUtf8(messageObj.text),
        });
    });

    const localPeerId = node.libp2p.peerId.toString();

    const remotePeers = await node.libp2p.peerStore.all();
    const remotePeerId = remotePeers[0].id.toString();

    return {
        unsubscribeFromMessages,
        info: {
            multiAddr,
            contentTopic,
            localPeerId,
            remotePeerId,
        },
        sendMessage: async ({ text, nick }) => {
            if (!text || !nick) {
                return;
            }

            const protoMessage = ChatMessage.create({
                nick,
                timestamp: Date.now(),
                text: utils.utf8ToBytes(text),
            });

            await node.lightPush.push(Encoder, {
                payload: ChatMessage.encode(protoMessage).finish(),
            });
        }
    };
}

// UI adapter
function initUI() {
    const exitButton = document.getElementById("exit");
    const sendButton = document.getElementById("send");

    const statusBlock = document.getElementById("status");
    const localPeerBlock = document.getElementById("localPeerId");
    const remotePeerId = document.getElementById("remotePeerId");
    const remoteMultiAddr = document.getElementById("remoteMultiAddr");
    const contentTopicBlock = document.getElementById("contentTopic");

    const messagesBlock = document.getElementById("messages");

    const nickText = document.getElementById("nickText");
    const messageText = document.getElementById("messageText");

    return {
        // UI events
        onExit: (cb) => {
            exitButton.addEventListener("click", cb); 
        },
        onSendMessage: (cb) => {
            sendButton.addEventListener("click", () => {
                cb({
                    nick: nickText.value,
                    text: messageText.value,
                }).then(() => {
                    messageText.value = "";
                });
            });
        },
        // UI renderers
        setStatus: (value) => {
            statusBlock.innerText = value.toString();
        },
        setLocalPeer: (id) => {
            localPeerBlock.innerText = id.toString();
        },
        setRemotePeer: (id) => {
            remotePeerId.innerText = id.toString();
        },
        setRemoteMultiAddr: (multiAddr) => {
            remoteMultiAddr.innerText = multiAddr.toString();
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
    };
}
