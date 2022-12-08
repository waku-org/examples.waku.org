import * as utils from "https://unpkg.com/@waku/byte-utils@0.0.2/bundle/index.js";
import * as wakuCreate from "https://unpkg.com/@waku/create@0.0.4/bundle/index.js";
import { waitForRemotePeer } from "https://unpkg.com/@waku/core@0.0.6/bundle/lib/wait_for_remote_peer.js";
import * as wakuMessage from "https://unpkg.com/@waku/core@0.0.6/bundle/lib/waku_message/version_0.js";

const MULTI_ADDR = "/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm";
const CONTENT_TOPIC = "/toy-chat/2/huilong/proto";
const PROTOCOLS = ["filter", "lightpush"];

const { sendMessage, unsubscribeFromMessages } = await initializeWakuContext({
    protocols: PROTOCOLS,
    multiAddr: MULTI_ADDR,
    contentTopic: CONTENT_TOPIC,
    onMessageReceived: ({ nick, timestamp, text }) => {
        console.log(timestamp, '\t', nick, ": ", text);
    },
});

async function initializeWakuContext({
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

    return {
        unsubscribeFromMessages,
        sendMessage: async ({ text, nick }) => {
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
