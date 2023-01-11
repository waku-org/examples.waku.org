import { createLightNode } from "js-waku/lib/create_waku";
import { utils } from "js-waku";
import { waitForRemotePeer } from "js-waku/lib/wait_for_remote_peer";
import {
  Fleet,
  getPredefinedBootstrapNodes,
} from "js-waku/lib/predefined_bootstrap_nodes";
import { PeerDiscoveryStaticPeers } from "js-waku/lib/peer_discovery_static_list";
import { Protocols } from "js-waku";
import * as noise from "@waku/noise";
import protobuf from "protobufjs";
import QRCode from "qrcode";
// TODO: Get rid of these
import hexToArrayBuffer from "hex-to-array-buffer";
import arrayBufferToHex from "array-buffer-to-hex";

const messagesDiv = document.getElementById("messages");
const nicknameInput = document.getElementById("nick-input");
const textInput = document.getElementById("text-input");
const sendButton = document.getElementById("send-btn");
const sendingStatusSpan = document.getElementById("sending-status");
const chatArea = document.getElementById("chat-area");
const qrCanvas = document.getElementById("qr-canvas");
const qrUrl = document.getElementById("qr-url");
const wakuStatusSpan = document.getElementById("waku-status");
const handshakeStatusSpan = document.getElementById("handshake-status");

function getPairingInfofromUrl() {
  const urlParts = window.location.href.split("?");
  if (urlParts.length < 2) return undefined;

  const pairingParts = decodeURIComponent(urlParts[1]).split(":");
  if (pairingParts.length < 6)
    throw new Error("invalid pairing information format");

  const qrMessageNameTag = new Uint8Array(
    hexToArrayBuffer(pairingParts.shift())
  );

  return new noise.InitiatorParameters(
    pairingParts.join(":"),
    qrMessageNameTag
  );
}

function getSenderAndResponder(node) {
  const sender = {
    async publish(encoder, msg) {
      await node.lightPush.push(encoder, msg);
    },
  };

  const msgQueue = new Array();
  const subscriptions = new Map();
  const intervals = new Map();

  const responder = {
    async subscribe(decoder) {
      const subscription = await node.filter.subscribe(
        [decoder],
        (wakuMessage) => {
          msgQueue.push(wakuMessage);
        }
      );
      subscriptions.set(decoder.contentTopic, subscription);
    },
    async nextMessage(contentTopic) {
      if (msgQueue.length != 0) {
        const oldestMsg = msgQueue.shift();
        if (oldestMsg.contentTopic === contentTopic) {
          return oldestMsg;
        }
      }

      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (msgQueue.length != 0) {
            clearInterval(interval);
            const oldestMsg = msgQueue.shift();
            if (oldestMsg.contentTopic === contentTopic) {
              resolve(oldestMsg);
            }
          }
        }, 100);
        intervals.set(contentTopic, interval);
      });
    },
    async stop(contentTopic) {
      if (intervals.has(contentTopic)) {
        clearInterval(intervals.get(contentTopic));
        intervals.delete(contentTopic);
      }
      if (subscriptions.has(contentTopic)) {
        await subscriptions.get(contentTopic)();
        subscriptions.delete(contentTopic);
      } else {
        console.log("Subscriptipon doesnt exist");
      }
    },
  };

  return [sender, responder];
}

async function confirmAuthCodeFlow(pairingObj) {
  const authCode = await pairingObj.getAuthCode();
  pairingObj.validateAuthCode(confirm("Confirm that authcode is: " + authCode));
}

async function hideQR() {
  qrCanvas.remove();
  qrUrl.remove();
}

async function disableUI() {
  hideQR();
  chatArea.remove();
}

// Function to update the fields to guide the user by disabling buttons.
const updateFields = () => {
  const readyToSend = nicknameInput.value !== "";
  textInput.disabled = !readyToSend;
  sendButton.disabled = !readyToSend;
};

// Protobuf
const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("nick", 2, "string"))
  .add(new protobuf.Field("text", 3, "bytes"));

let messages = [];

const updateMessages = () => {
  messagesDiv.innerHTML = "<ul>";
  messages.forEach((msg) => {
    messagesDiv.innerHTML += `<li>${msg}</li>`;
  });
  messagesDiv.innerHTML += "</ul>";
};

const onMessage = (wakuMessage) => {
  const { timestamp, nick, text } = ProtoChatMessage.decode(
    wakuMessage.payload
  );
  const time = new Date();
  time.setTime(Number(timestamp) * 1000);

  messages.push(
    `(${nick}) <strong>${utils.bytesToUtf8(
      text
    )}</strong> <i>[${time.toISOString()}]</i>`
  );
  updateMessages();
};

async function main() {
  // Starting the node
  const node = await createLightNode({
    libp2p: {
      peerDiscovery: [
        new PeerDiscoveryStaticPeers(getPredefinedBootstrapNodes(Fleet.Test)),
      ],
    },
  });

  try {
    await node.start();

    await waitForRemotePeer(node, [Protocols.Filter, Protocols.LightPush]);

    wakuStatusSpan.innerHTML = "connected";

    const [sender, responder] = getSenderAndResponder(node);

    const myStaticKey = noise.generateX25519KeyPair();

    const pairingParameters = getPairingInfofromUrl();

    const initiator = pairingParameters ? true : false;

    let encoder;
    let decoder;

    if (initiator) {
      console.log("Initiator");
      qrCanvas.remove(); // Initiator does not require a QR code

      const pairingObj = new noise.WakuPairing(
        sender,
        responder,
        myStaticKey,
        pairingParameters
      );
      const pExecute = pairingObj.execute(120000); // timeout after 2m

      confirmAuthCodeFlow(pairingObj);

      try {
        handshakeStatusSpan.innerHTML = "waiting for handshake...";

        [encoder, decoder] = await pExecute;

        handshakeStatusSpan.innerHTML = "handshake completed!";
      } catch (err) {
        handshakeStatusSpan.innerHTML = err.message;
        disableUI();
        console.error(err);
      }

      /*
      // The information needs to be backed up to decrypt messages sent with
      // codecs generated with the handshake. The `handshakeResult` variable
      // contains private information that needs to be stored safely
      const contentTopic = pairingObj.contentTopic;
      const handshakeResult = pairingObj.getHandshakeResult();

      // To restore the codecs for decrypting older messages, or continuing an existing
      // session, use this:
      [encoder, decoder] = WakuPairing.getSecureCodec(contentTopic, handshakeResult);
      */
    } else {
      console.log("Responder");

      const pairingObj = new noise.WakuPairing(
        sender,
        responder,
        myStaticKey,
        new noise.ResponderParameters()
      );
      const pExecute = pairingObj.execute(120000); // timeout after 2m

      confirmAuthCodeFlow(pairingObj);

      const pInfo = pairingObj.getPairingInfo();

      // Data to encode in the QR code. The qrMessageNametag too to the QR string (separated by )
      const qrString =
        arrayBufferToHex(pInfo.qrMessageNameTag) + ":" + pInfo.qrCode;
      const qrURLString =
        window.location.href + "?" + encodeURIComponent(qrString);

      handshakeStatusSpan.innerHTML = "generating QR code...";

      console.log("Generating QR...");

      QRCode.toCanvas(qrCanvas, qrURLString, (err) => {
        if (err) {
          handshakeStatusSpan.innerHTML = err.message;
          disableUI();
          console.error(err);
        } else {
          handshakeStatusSpan.innerHTML = "waiting for handshake to start";
          qrUrl.href = qrURLString;
          qrUrl.style.display = "block";
        }
      });

      try {
        handshakeStatusSpan.innerHTML = "executing handshake...";

        [encoder, decoder] = await pExecute;

        handshakeStatusSpan.innerHTML = "handshake completed!";

        hideQR();
      } catch (err) {
        handshakeStatusSpan.innerHTML = err.message;
        disableUI();
        console.error(err);
      }

      /*
      // The information needs to be backed up to decrypt messages sent with
      // codecs generated with the handshake. The `handshakeResult` variable
      // contains private information that needs to be stored safely
      const contentTopic = pairingObj.contentTopic;
      const handshakeResult = pairingObj.getHandshakeResult();

      // To restore the codecs for decrypting older messages, or continuing an existing
      // session, use this:
      [encoder, decoder] = WakuPairing.getSecureCodec(contentTopic, handshakeResult);
      */
    }

    nicknameInput.onchange = updateFields;
    nicknameInput.onblur = updateFields;

    sendButton.onclick = async () => {
      const text = utils.utf8ToBytes(textInput.value);
      const timestamp = new Date();
      const msg = ProtoChatMessage.create({
        text,
        nick: nicknameInput.value,
        timestamp: Math.floor(timestamp.valueOf() / 1000),
      });
      const payload = ProtoChatMessage.encode(msg).finish();
      sendingStatusSpan.innerText = "sending...";
      await node.lightPush.push(encoder, { payload, timestamp });
      sendingStatusSpan.innerText = "sent!";

      onMessage({ payload });

      textInput.value = null;
      setTimeout(() => {
        sendingStatusSpan.innerText = "";
      }, 5000);
    };

    await node.filter.subscribe([decoder], onMessage);

    chatArea.style.display = "block";
  } catch (err) {
    wakuStatusSpan.innerHTML = err.message;
    disableUI();
    return;
  }
}
main();
