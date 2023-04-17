import { createLightNode } from "@waku/create";
import * as utils from "@waku/utils/bytes";
import { waitForRemotePeer } from "@waku/core";
import { Protocols } from "@waku/interfaces";
import * as noise from "@waku/noise";
import protobuf from "protobufjs";
import QRCode from "qrcode";

// Protobuf
const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("nick", 2, "string"))
  .add(new protobuf.Field("text", 3, "bytes"));

main();

async function main() {
  const ui = initUI();
  ui.waku.connecting();

  // Starting the node
  const node = await createLightNode({
    defaultBootstrap: true,
  });

  try {
    await node.start();
    await waitForRemotePeer(node, [Protocols.Filter, Protocols.LightPush]);

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

    ui.message.display();

    await node.filter.subscribe(
      [decoder],
      ui.message.onReceive.bind(ui.message)
    );

    ui.message.onSend(async (text, nick) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const message = ProtoChatMessage.create({
        nick,
        timestamp,
        text: utils.utf8ToBytes(text),
      });
      const payload = ProtoChatMessage.encode(message).finish();

      await node.lightPush.send(encoder, { payload, timestamp });
    });
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
