import { createLightNode, waitForRemotePeer } from "@waku/sdk";
import * as utils from "@waku/utils/bytes";
import * as noise from "@waku/noise";
import protobuf from "protobufjs";
import QRCode from "qrcode";

// Protobuf
const ProtoMessage = new protobuf.Type("Message").add(
  new protobuf.Field("data", 3, "string")
);

main();

async function main() {
  const ui = initUI();
  ui.waku.connecting();

  // Starting the node
  const node = await createLightNode({ defaultBootstrap: true });

  try {
    await node.start();
    await waitForRemotePeer(node, ["filter", "lightpush"]);

    ui.waku.connected();

    const myStaticKey = noise.generateX25519KeyPair();
    const urlPairingInfo = getPairingInfoFromURL();

    const pairingObj = new noise.WakuPairing(
      node.lightPush,
      node.filter,
      myStaticKey,
      urlPairingInfo || new noise.ResponderParameters()
    );
    const pExecute = pairingObj.execute(120000); // timeout after 2m

    scheduleHandshakeAuthConfirmation(pairingObj, ui);

    let sendWakuMessage;
    let listenToWakuMessages;

    try {
      ui.handshake.waiting();

      if (!urlPairingInfo) {
        const pairingURL = buildPairingURLFromObj(pairingObj);
        ui.shareInfo.setURL(pairingURL);
        ui.shareInfo.renderQR(pairingURL);
        ui.shareInfo.show();
      }

      [sendWakuMessage, listenToWakuMessages] = await buildWakuMessage(
        node,
        pExecute
      );

      ui.handshake.connected();
      ui.shareInfo.hide();
    } catch (err) {
      ui.handshake.error(err.message);
      ui.hide();
    }

    ui.message.display();

    const { peerConnection, sendMessage: sendRTCMessage } = initRTC({
      ui,
      onReceive: ui.message.onReceive.bind(ui.message),
    });

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log("candidate sent");
        try {
          ui.rtc.sendingCandidate();
          await sendWakuMessage({
            type: "candidate",
            candidate: event.candidate,
          });
        } catch (error) {
          ui.rtc.error(error.message);
        }
      }
    };

    const sendOffer = async () => {
      console.log("offer sent");
      ui.rtc.sendingOffer();

      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        await sendWakuMessage({
          type: "offer",
          offer,
        });
      } catch (error) {
        ui.rtc.error(error.message);
      }
    };

    const sendAnswer = async (data) => {
      console.log("answer sent");
      ui.rtc.sendingAnswer();
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        const answer = await peerConnection.createAnswer();
        peerConnection.setLocalDescription(answer);

        await sendWakuMessage({
          type: "answer",
          answer,
        });
      } catch (error) {
        ui.rtc.error(error.message);
      }
    };

    const receiveAnswer = async (data) => {
      try {
        console.log("answer received");
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        console.log("answer saved");

        await sendWakuMessage({
          type: "ready",
          text: "received answer",
        });
      } catch (error) {
        ui.rtc.error(error.message);
      }
    };

    const receiveCandidate = async (data) => {
      try {
        console.log("candidate saved");
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        ui.rtc.error(error.message);
      }
    };

    const handleWakuMessages = async (data) => {
      if (data.type === "offer") {
        await sendAnswer(data);
      }

      if (data.type === "answer") {
        await receiveAnswer(data);
      }

      if (data.type === "ready") {
        console.log("RTC: partner is", data.text);
      }

      if (data.type === "candidate") {
        await receiveCandidate(data);
      }
    };

    await listenToWakuMessages(handleWakuMessages);
    ui.message.onSend(sendRTCMessage);

    // if we are initiator of Noise handshake
    // let's initiate Web RTC as well
    if (!urlPairingInfo) {
      await sendOffer();
    }
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

async function scheduleHandshakeAuthConfirmation(pairingObj, ui) {
  const authCode = await pairingObj.getAuthCode();
  ui.handshake.connecting();
  pairingObj.validateAuthCode(confirm("Confirm that authcode is: " + authCode));
}

async function buildWakuMessage(node, noiseExecute) {
  const [encoder, decoder] = await noiseExecute;

  const sendMessage = async (message) => {
    let payload = ProtoMessage.create({
      data: JSON.stringify(message),
    });
    payload = ProtoMessage.encode(payload).finish();

    return node.lightPush.send(encoder, { payload });
  };

  const listenToMessages = async (fn) => {
    return node.filter.subscribe([decoder], ({ payload }) => {
      const { data } = ProtoMessage.decode(payload);
      fn(JSON.parse(data));
    });
  };

  return [sendMessage, listenToMessages];
}

function initRTC({ ui, onReceive }) {
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  const peerConnection = new RTCPeerConnection(configuration);
  const sendChannel = peerConnection.createDataChannel("chat");

  let receiveChannel;

  sendChannel.onopen = (event) => {
    ui.rtc.ready();
    console.log("onopen send", event);
  };

  peerConnection.ondatachannel = (event) => {
    receiveChannel = event.channel;

    receiveChannel.onmessage = (event) => {
      onReceive(JSON.parse(event.data));
    };

    receiveChannel.onopen = (event) => {
      ui.rtc.ready();
      console.log("onopen receive", event);
    };
  };

  const sendMessage = (text, nick) => {
    sendChannel.send(JSON.stringify({ text, nick, timestamp: Date.now() }));
  };

  return {
    peerConnection,
    sendChannel,
    receiveChannel,
    sendMessage,
  };
}

function initUI() {
  const messagesList = document.getElementById("messages");
  const nicknameInput = document.getElementById("nick-input");
  const textInput = document.getElementById("text-input");
  const sendButton = document.getElementById("send-btn");
  const chatArea = document.getElementById("chat-area");
  const wakuStatusSpan = document.getElementById("waku-status");
  const handshakeStatusSpan = document.getElementById("handshake-status");

  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrlContainer = document.getElementById("qr-url-container");
  const qrUrl = document.getElementById("qr-url");
  const copyURLButton = document.getElementById("copy-url");
  const openTabButton = document.getElementById("open-tab");

  const rtcStatus = document.getElementById("rtc-status");
  const connectChat = document.getElementById("connect-chat-btn");

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
      onReceive(data) {
        const { timestamp, nick, text } = data;

        this._render({
          nick,
          time: timestamp,
          text,
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
    rtc: {
      _val(msg) {
        rtcStatus.innerText = msg;
      },
      _class(name) {
        rtcStatus.className = name;
      },
      sendingOffer() {
        this._val("sending offer");
        this._class("progress");
      },
      sendingAnswer() {
        this._val("sending answer");
        this._class("progress");
      },
      sendingCandidate() {
        this._val("sending ice candidate");
        this._class("progress");
      },
      ready() {
        this._val("ready");
        this._class("success");
      },
      error(msg) {
        this._val(msg);
        this._class("error");
      },
      onConnect(cb) {
        connectChat.addEventListener("click", cb);
      },
    },
    hide() {
      this.shareInfo.hide();
      chatArea.style.display = "none";
    },
  };
}
