import * as utils from 'https://unpkg.com/@waku/byte-utils@0.0.2/bundle/index.js';
import * as wakuCreate from 'https://unpkg.com/@waku/create@0.0.4/bundle/index.js'
import { waitForRemotePeer } from 'https://unpkg.com/@waku/core@0.0.6/bundle/lib/wait_for_remote_peer.js'
import * as wakuMessage from 'https://unpkg.com/@waku/core@0.0.6/bundle/lib/waku_message/version_0.js'

const MULTI_ADDR = "/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm";
const CONTENT_TOPIC = "/js-waku-examples/1/chat/utf8";
const PROTOCOLS = ["filter", "lightpush"];

const { sendMessage, unsubscribeFromMessages } = await initializeWakuContext({
    multiAddr: MULTI_ADDR,
    protocols: PROTOCOLS,
    contentTopic: CONTENT_TOPIC,
    onMessageReceived: (message) => {
        console.log(message);
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

    const node = await wakuCreate.createLightNode();

    await node.start();

    await node.dial(multiAddr, protocols);
    await waitForRemotePeer(node, protocols);

    const unsubscribeFromMessages = await node.filter.subscribe([Decoder], (wakuMessage) => {
        const messageText = utils.bytesToUtf8(wakuMessage.payload);
        onMessageReceived(messageText);
    });

    return {
        unsubscribeFromMessages,
        sendMessage: async (value) => {
            await node.lightPush.push(Encoder, {
                payload: utils.utf8ToBytes(value)
            });
        }
    };
}
