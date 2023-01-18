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

// Protobuf
const ProtoChatMessage = new protobuf.Type("ChatMessage").add(
  new protobuf.Field("text", 3, "bytes")
);

main();

async function main() {
  const ui = initUI();
  ui.waku.connecting();

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

    ui.waku.connected();

    const [sender, responder] = getSenderAndResponder(node);
    const myStaticKey = noise.generateX25519KeyPair();
    const urlPairingInfo = getPairingInfoFromURL();

    const pairingObj = new noise.WakuPairing(
      sender,
      responder,
      myStaticKey,
      urlPairingInfo || new noise.ResponderParameters()
    );
    const pExecute = pairingObj.execute(120000); // timeout after 2m

    scheduleHandshakeAuthConfirmation(pairingObj, ui);

    let encoder;
    let decoder;

    try {
      ui.handshake.waiting();

      if (!urlPairingInfo) {
        const pairingURL = buildPairingURLFromObj(pairingObj);
        ui.shareInfo.setURL(pairingURL);
        ui.shareInfo.renderQR(pairingURL);
        ui.shareInfo.show();
      }

      [encoder, decoder] = await pExecute;

      ui.handshake.connected();
      ui.shareInfo.hide();
    } catch (err) {
      ui.handshake.error(err.message);
      ui.hide();
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
    ui.message.display();

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
    let peerConnection = new RTCPeerConnection(configuration);
    let sendDataChannel = peerConnection.createDataChannel("chat");
    let receiveChannel;

    sendDataChannel.onopen = (event) => {
      console.log("onopen", event);
    };
    sendDataChannel.onclose = (event) => {
      console.log("onclose", event);
    };

    peerConnection.ondatachannel = (event) => {
      receiveChannel = event.channel;
      window.receiveChannel = receiveChannel;
      receiveChannel.onmessage = (event) => {
        console.log("onmessage", event);
      };
      receiveChannel.onopen = (event) => {
        console.log("onopen receive", event);
      };
      receiveChannel.onclose = (event) => {
        console.log("onclose receive", event);
      };
    };

    peerConnection.onicecandidate = async (event) => {
      console.log("onicecandidate event", event);
      if (event.candidate) {
        // try {
        //     await peerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
        // } catch(error) {
        //     console.log("onicecandidate error", error);
        // }
        let message = ProtoChatMessage.create({
          text: utils.utf8ToBytes(
            JSON.stringify({
              type: "candidate",
              candidate: event.candidate,
            })
          ),
        });
        message = ProtoChatMessage.encode(message).finish();

        await node.lightPush.push(encoder, { payload: message });
      }
    };

    peerConnection.oniceconnectionstatechange = console.log;

    window.sendOffer = sendOffer;
    window.sendDataChannel = sendDataChannel;

    async function sendOffer() {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      let offerMessage = ProtoChatMessage.create({
        text: utils.utf8ToBytes(
          JSON.stringify({
            type: "offer",
            offer,
          })
        ),
      });
      offerMessage = ProtoChatMessage.encode(offerMessage).finish();

      await node.lightPush.push(encoder, { payload: offerMessage });
    }

    async function sendAnswer(data) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      const answer = await peerConnection.createAnswer();
      peerConnection.setLocalDescription(answer);

      let answerMessage = ProtoChatMessage.create({
        text: utils.utf8ToBytes(
          JSON.stringify({
            type: "answer",
            answer,
          })
        ),
      });
      answerMessage = ProtoChatMessage.encode(answerMessage).finish();

      await node.lightPush.push(encoder, { payload: answerMessage });
    }

    async function handleAnswer(data) {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );

        let message = ProtoChatMessage.create({
          text: utils.utf8ToBytes(
            JSON.stringify({
              type: "ready",
              text: "just ready",
            })
          ),
        });
        message = ProtoChatMessage.encode(message).finish();

        await node.lightPush.push(encoder, { payload: message });
      }
    }

    async function handleCandidate(data) {
      if (data.candidate) {
        try {
          console.log("handleCandidate", data.candidate);
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error("handleCandidate", error);
        }
      }
    }

    async function handleReceive({ payload }) {
      const { text } = ProtoChatMessage.decode(payload);
      const data = JSON.parse(utils.bytesToUtf8(text));

      if (data.type === "offer") {
        await sendAnswer(data);
      }

      if (data.type === "answer") {
        await handleAnswer(data);
      }

      if (data.type === "ready") {
        console.log("partner is ready", data);
      }

      if (data.type === "candidate") {
        await handleCandidate(data);
      }
    }

    await node.filter.subscribe([decoder], handleReceive);
  } catch (err) {
    ui.waku.error(err.message);
    ui.hide();
  }
}

function buildPairingURLFromObj(pairingObj) {
  const pInfo = pairingObj.getPairingInfo();

  // Data to encode in the QR code. The qrMessageNametag too to the QR string (separated by )
  const messageNameTagParam = `messageNameTag=${utils.bytesToHex(
    pInfo.qrMessageNameTag
  )}`;
  const qrCodeParam = `qrCode=${encodeURIComponent(pInfo.qrCode)}`;

  return `${window.location.href}?${messageNameTagParam}&${qrCodeParam}`;
}

function getPairingInfoFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  const messageNameTag = urlParams.get("messageNameTag");
  const qrCodeString = urlParams.get("qrCode");

  if (!(messageNameTag && qrCodeString)) {
    return undefined;
  }

  return new noise.InitiatorParameters(
    decodeURIComponent(qrCodeString),
    utils.hexToBytes(messageNameTag)
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

async function scheduleHandshakeAuthConfirmation(pairingObj, ui) {
  const authCode = await pairingObj.getAuthCode();
  ui.handshake.connecting();
  pairingObj.validateAuthCode(confirm("Confirm that authcode is: " + authCode));
}

function initUI() {
  const messagesList = document.getElementById("messages");
  const nicknameInput = document.getElementById("nick-input");
  const textInput = document.getElementById("text-input");
  const sendButton = document.getElementById("send-btn");
  const sendingStatusSpan = document.getElementById("sending-status");
  const chatArea = document.getElementById("chat-area");
  const wakuStatusSpan = document.getElementById("waku-status");
  const handshakeStatusSpan = document.getElementById("handshake-status");

  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrlContainer = document.getElementById("qr-url-container");
  const qrUrl = document.getElementById("qr-url");
  const copyURLButton = document.getElementById("copy-url");
  const openTabButton = document.getElementById("open-tab");

  copyURLButton.onclick = () => {
    const copyText = document.getElementById("qr-url"); // need to get it each time otherwise copying does not work
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
  };

  openTabButton.onclick = () => {
    window.open(qrUrl.value, "_blank");
  };

  const disableChatUIStateIfNeeded = () => {
    const readyToSend = nicknameInput.value !== "";
    textInput.disabled = !readyToSend;
    sendButton.disabled = !readyToSend;
  };
  nicknameInput.onchange = disableChatUIStateIfNeeded;
  nicknameInput.onblur = disableChatUIStateIfNeeded;

  return {
    shareInfo: {
      setURL(url) {
        qrUrl.value = url;
      },
      hide() {
        qrUrlContainer.style.display = "none";
      },
      show() {
        qrUrlContainer.style.display = "flex";
      },
      renderQR(url) {
        QRCode.toCanvas(qrCanvas, url, (err) => {
          if (err) {
            throw err;
          }
        });
      },
    },
    waku: {
      _val(msg) {
        wakuStatusSpan.innerText = msg;
      },
      _class(name) {
        wakuStatusSpan.className = name;
      },
      connecting() {
        this._val("connecting...");
        this._class("progress");
      },
      connected() {
        this._val("connected");
        this._class("success");
      },
      error(msg) {
        this._val(msg);
        this._class("error");
      },
    },
    handshake: {
      _val(val) {
        handshakeStatusSpan.innerText = val;
      },
      _class(name) {
        handshakeStatusSpan.className = name;
      },
      error(msg) {
        this._val(msg);
        this._class("error");
      },
      waiting() {
        this._val("waiting for handshake...");
        this._class("progress");
      },
      generating() {
        this._val("generating QR code...");
        this._class("progress");
      },
      connecting() {
        this._val("executing handshake...");
        this._class("progress");
      },
      connected() {
        this._val("handshake completed!");
        this._class("success");
      },
    },
    message: {
      _render({ time, text, nick }) {
        messagesList.innerHTML += `
          <li>
            (${nick})
            <strong>${text}</strong>
            <i>[${new Date(time).toISOString()}]</i>
          </li>
        `;
      },
      _status(text, className) {
        sendButton.className = className;
      },
      onReceive({ payload }) {
        const { timestamp, nick, text } = ProtoChatMessage.decode(payload);

        this._render({
          nick,
          time: timestamp * 1000,
          text: utils.bytesToUtf8(text),
        });
      },
      onSend(cb) {
        sendButton.addEventListener("click", async () => {
          try {
            this._status("sending...", "progress");
            await cb(textInput.value, nicknameInput.value);
            this._status("sent", "success");

            this._render({
              time: Date.now(), // a bit different from what receiver will see but for the matter of example is good enough
              text: textInput.value,
              nick: nicknameInput.value,
            });
            textInput.value = "";
          } catch (e) {
            this._status(`error: ${e.message}`, "error");
          }
        });
      },
      display() {
        chatArea.style.display = "block";
        this._status("waiting for input", "progress");
      },
    },
    hide() {
      this.shareInfo.hide();
      chatArea.style.display = "none";
    },
  };
}
