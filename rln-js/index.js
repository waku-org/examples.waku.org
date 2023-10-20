import * as utils from "https://unpkg.com/@waku/utils@0.0.10/bundle/bytes.js";
import {
  createEncoder,
  createDecoder,
  waitForRemotePeer,
  createLightNode,
} from "https://unpkg.com/@waku/sdk@0.0.18/bundle/index.js";
import { protobuf } from "https://taisukef.github.io/protobuf-es.js/dist/protobuf-es.js";
import {
  create,
  Keystore,
  RLNDecoder,
  RLNEncoder,
  RLNContract,
  SEPOLIA_CONTRACT,
} from "https://unpkg.com/@waku/rln@0.1.1-fa49e29/bundle/index.js";
import { ethers } from "https://unpkg.com/ethers@5.7.2/dist/ethers.esm.min.js";

const ContentTopic = "/toy-chat/2/luzhou/proto";

// Protobuf
const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("nick", 2, "string"))
  .add(new protobuf.Field("text", 3, "bytes"));

const SIGNATURE_MESSAGE =
  "The signature of this message will be used to generate your RLN credentials. Anyone accessing it may send messages on your behalf, please only share with the RLN dApp";

run()
  .then(() => {
    console.log("Successfully started application.");
  })
  .catch((err) => {
    console.error("Failed at starting application with ", err.message);
  });

async function run() {
  const ui = initUI();
  const rln = await initRLN(ui);
  await initWaku(ui, rln);
}

async function initRLN(ui) {
  const result = {
    encoder: undefined,
    rlnInstance: undefined,
    contract: undefined,
  };

  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  ui.setRlnStatus("WASM Blob download in progress...");
  const rlnInstance = await create();
  ui.setRlnStatus("WASM Blob download in progress... done!");

  const rlnContract = await RLNContract.init(rlnInstance, {
    registryAddress: SEPOLIA_CONTRACT.address,
    provider: provider.getSigner(),
  });

  result.contract = rlnContract;

  // Keystore logic
  let keystore = initKeystore(ui);
  ui.createKeystoreOptions(keystore);

  ui.onKeystoreImport(async (text) => {
    try {
      keystore = Keystore.fromString(text);
      ui.setKeystoreStatus("Imported keystore from json");
    } catch (err) {
      console.error("Failed to import keystore:", err);
      ui.setKeystoreStatus("Failed to import, fallback to current keystore");
    }
    ui.createKeystoreOptions(keystore);
    saveLocalKeystore(keystore);
  });

  ui.onKeystoreExport(async () => {
    return keystore.toString();
  });

  ui.onKeystoreRead(async (hash, password) => {
    return keystore.readCredential(hash, password);
  });

  // Wallet logic
  window.ethereum.on("accountsChanged", ui.setAccount);
  window.ethereum.on("chainChanged", (chainId) => {
    const id = parseInt(chainId, 16);
    ui.disableIfNotSepolia(id);
  });
  ui.onConnectWallet(async () => {
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      ui.setAccount(accounts);
      const network = await provider.getNetwork();
      ui.disableIfNotSepolia(network.chainId);
    } catch (e) {
      console.log("No web3 provider available", e);
    }
  });

  ui.onRetrieveDetails(async () => {
    const filter = rlnContract.contract.filters.MemberRegistered();

    ui.disableRetrieveButton();
    await rlnContract.fetchMembers(rlnInstance);
    ui.enableRetrieveButton();

    rlnContract.subscribeToMembers(rlnInstance);

    const last = rlnContract.members.at(-1);

    if (last) {
      ui.setLastMember(last.index, last.idCommitment);
    }

    // make sure we have subscriptions to keep updating last item
    rlnContract.contract.on(filter, (_idCommitment, _index, event) => {
      ui.setLastMember(event.args.index, event.args.idCommitment);
    });
  });

  let signature;
  let membershipId;
  let credentials;

  ui.onWalletImport(async () => {
    const signer = provider.getSigner();

    signature = await signer.signMessage(
      `${SIGNATURE_MESSAGE}. Nonce: ${Math.ceil(Math.random() * 1000)}`
    );
    credentials = await rlnInstance.generateSeededIdentityCredential(signature);

    const idCommitment = ethers.utils.hexlify(credentials.IDCommitment);

    rlnContract.members.forEach((m) => {
      if (m.idCommitment === idCommitment) {
        membershipId = m.index.toString();
      }
    });

    if (membershipId) {
      result.encoder = new RLNEncoder(
        createEncoder({
          ephemeral: false,
          contentTopic: ContentTopic,
        }),
        rlnInstance,
        membershipId,
        credentials
      );
    }

    ui.setMembershipInfo(membershipId, credentials);

    const network = await provider.getNetwork();
    ui.enableRegisterButtonForSepolia(network.chainId);
  });

  ui.onRegister(async () => {
    ui.setRlnStatus("Trying to register...");
    const memberInfo = signature
      ? await rlnContract.registerWithSignature(rlnInstance, signature)
      : await rlnContract.registerWithKey(credentials);

    membershipId = memberInfo.index.toNumber();

    console.log(
      "Obtained index for current membership credentials",
      membershipId
    );

    const password = ui.getKeystorePassword();

    if (!password) {
      ui.setKeystoreStatus("Cannot add credentials, no password.");
    }

    const keystoreHash = await keystore.addCredential(
      {
        membership: {
          treeIndex: membershipId,
          chainId: SEPOLIA_CONTRACT.chainId,
          address: SEPOLIA_CONTRACT.address,
        },
        identity:
          credentials ||
          rlnInstance.generateSeededIdentityCredential(signature),
      },
      password
    );
    saveLocalKeystore(keystore);
    ui.addKeystoreOption(keystoreHash);
    ui.setKeystoreStatus(`Added credential to Keystore`);

    ui.setRlnStatus("Successfully registered.");
    ui.setMembershipInfo(membershipId, credentials, keystoreHash);
    ui.enableDialButton();
  });

  return result;
}

async function initWaku(ui, rln) {
  ui.setWakuStatus("Creating Waku node.");
  const node = await createLightNode();
  ui.setWakuStatus("Starting Waku node.");

  await node.start();
  ui.setWakuStatus("Waku node started.");

  const verifyMessage = (message) => {
    if (message.proofState === "verifying...") {
      try {
        console.log("Verifying proof without roots");
        console.time("proof_verify_timer");
        const res = message.verify(rln.contract.roots());
        console.timeEnd("proof_verify_timer");
        console.log("proof verified without roots", res);
        if (res === undefined) {
          message.proofState = "no proof attached";
        } else if (res) {
          message.proofState = "verified.";
        } else {
          message.proofState = "invalid!";
        }
      } catch (e) {
        message.proofState = "Error encountered, check console";
        console.error("Error verifying proof:", e);
      }

      console.log("Verifying proof with roots", message.verify());
    }
  };

  const onFilterMessage = (wakuMessage) => {
    const { timestamp, nick, text } = ProtoChatMessage.decode(
      wakuMessage.payload
    );

    const time = new Date();
    time.setTime(Number(timestamp) * 1000);

    if (wakuMessage.rateLimitProof) {
      console.log("Proof received:", wakuMessage.rateLimitProof);
    }

    wakuMessage.proofState = !!wakuMessage.rateLimitProof
      ? "verifying..."
      : "no proof attached";

    wakuMessage.msg = `
            (${nick})
            <strong>${utils.bytesToUtf8(text)}</strong>
            <i>[${time.toISOString()}]</i>
        `;

    verifyMessage(wakuMessage);
    ui.renderMessage(wakuMessage);
  };

  ui.onDial(async (ma) => {
    ui.setWakuStatus("Dialing peer.");

    // TODO(@weboko): move this fix into Waku.dial
    const multiaddr = MultiformatsMultiaddr.multiaddr(ma);
    await node.dial(multiaddr, ["filter", "lightpush"]);
    await waitForRemotePeer(node, ["filter", "lightpush"]);

    ui.setWakuStatus("Waku node connected.");

    const decoder = new RLNDecoder(
      rln.rlnInstance,
      createDecoder(ContentTopic)
    );

    await node.filter.subscribe(decoder, onFilterMessage);

    ui.setWakuStatus("Waku node subscribed.");
    ui.enableChatButtonsIfNickSet();
  });

  ui.onSendMessage(async (nick, text) => {
    const timestamp = new Date();
    const msg = ProtoChatMessage.create({
      text,
      nick,
      timestamp: Math.floor(timestamp.valueOf() / 1000),
    });
    const payload = ProtoChatMessage.encode(msg).finish();
    console.log("Sending message with proof...");

    ui.setSendingStatus("sending...");
    await node.lightPush.send(rln.encoder, { payload, timestamp });
    ui.setSendingStatus("sent!");

    console.log("Message sent!");
    ui.clearMessageArea();
  });
}

function initUI() {
  const statusSpan = document.getElementById("status");

  // Blockchain Elements
  const addressDiv = document.getElementById("address");
  const connectWalletButton = document.getElementById("connect-wallet");
  const latestMembershipSpan = document.getElementById("latest-membership-id");
  const retrieveRLNDetailsButton = document.getElementById(
    "retrieve-rln-details"
  );

  const importFromWalletButton = document.getElementById(
    "import-from-wallet-button"
  );

  const keystoreHashDiv = document.getElementById("keystoreHash");
  const idDiv = document.getElementById("id");
  const secretHashDiv = document.getElementById("secret-hash");
  const commitmentDiv = document.getElementById("commitment");
  const trapdoorDiv = document.getElementById("trapdoor");
  const nullifierDiv = document.getElementById("nullifier");
  const registerButton = document.getElementById("register-button");

  // Waku Elements
  const statusDiv = document.getElementById("waku-status");
  const remoteMultiAddrInput = document.getElementById("remote-multiaddr");
  const dialButton = document.getElementById("dial");

  const nicknameInput = document.getElementById("nick-input");
  const textInput = document.getElementById("textInput");
  const sendButton = document.getElementById("sendButton");
  const sendingStatusSpan = document.getElementById("sending-status");
  const messagesList = document.getElementById("messagesList");

  // Keystore
  const importKeystoreBtn = document.getElementById("importKeystore");
  const importKeystoreInput = document.getElementById("importKeystoreInput");
  const exportKeystore = document.getElementById("exportKeystore");
  const keystoreStatus = document.getElementById("keystoreStatus");
  const keystorePassword = document.getElementById("keystorePassword");
  const keystoreOptions = document.getElementById("keystoreOptions");
  const readKeystoreButton = document.getElementById("readKeystore");

  // set initial state
  keystoreHashDiv.innerText = "not registered yet";
  idDiv.innerText = "not registered yet";
  registerButton.disabled = true;
  textInput.disabled = true;
  sendButton.disabled = true;
  dialButton.disabled = true;
  retrieveRLNDetailsButton.disabled = true;
  nicknameInput.disabled = true;

  nicknameInput.onchange = enableChatIfNeeded;
  nicknameInput.onblur = enableChatIfNeeded;

  function enableChatIfNeeded() {
    if (nicknameInput.value) {
      textInput.disabled = false;
      sendButton.disabled = false;
    }
  }

  // Keystore
  keystorePassword.onchange = enableRegisterIfNeeded;
  keystorePassword.onblur = enableRegisterIfNeeded;
  function enableRegisterIfNeeded() {
    if (keystorePassword.value && commitmentDiv.innerText !== "none") {
      registerButton.disabled = false;
    }
  }

  return {
    // UI for RLN
    setRlnStatus(text) {
      statusSpan.innerText = text;
    },
    setMembershipInfo(id, credential, keystoreHash) {
      keystoreHashDiv.innerText = keystoreHash || "not registered yet";
      idDiv.innerText = id || "not registered yet";
      secretHashDiv.innerText = utils.bytesToHex(credential.IDSecretHash);
      commitmentDiv.innerText = utils.bytesToHex(credential.IDCommitment);
      nullifierDiv.innerText = utils.bytesToHex(credential.IDNullifier);
      trapdoorDiv.innerText = utils.bytesToHex(credential.IDTrapdoor);
    },
    setLastMember(index, _idCommitment) {
      try {
        const idCommitment = ethers.utils.zeroPad(
          ethers.utils.arrayify(_idCommitment),
          32
        );
        const indexInt = index.toNumber();
        console.debug(
          "IDCommitment registered in tree",
          idCommitment,
          indexInt
        );
        latestMembershipSpan.innerHTML = indexInt;
      } catch (err) {
        console.error(err); // TODO: the merkle tree can be in a wrong state. The app should be disabled
      }
    },
    disableIfNotSepolia(chainId) {
      if (!isSepolia(chainId)) {
        window.alert("Switch to Sepolia");

        registerButton.disabled = true;
        this.disableRetrieveButton();
      } else {
        this.enableRetrieveButton();
      }
    },
    enableRetrieveButton() {
      retrieveRLNDetailsButton.disabled = false;
    },
    disableRetrieveButton() {
      retrieveRLNDetailsButton.disabled = true;
    },
    enableRegisterButtonForSepolia(chainId) {
      registerButton.disabled =
        isSepolia(chainId) &&
        keystorePassword.value &&
        commitmentDiv.innerText !== "none"
          ? false
          : true;
    },
    getKeystorePassword() {
      return keystorePassword.value;
    },
    setAccount(accounts) {
      addressDiv.innerText = accounts.length ? accounts[0] : "";
    },
    onConnectWallet(fn) {
      connectWalletButton.addEventListener("click", async () => {
        await fn();
        importFromWalletButton.disabled = false;
      });
    },
    onRetrieveDetails(fn) {
      retrieveRLNDetailsButton.addEventListener("click", async () => {
        await fn();
      });
    },
    onWalletImport(fn) {
      importFromWalletButton.addEventListener("click", async () => {
        await fn();
      });
    },
    onRegister(fn) {
      registerButton.addEventListener("click", async () => {
        try {
          registerButton.disabled = true;
          await fn();
          registerButton.disabled = false;
        } catch (err) {
          alert(err);
          registerButton.disabled = false;
        }
      });
    },
    // Keystore
    addKeystoreOption(id) {
      const option = document.createElement("option");
      option.innerText = id;
      option.setAttribute("value", id);
      keystoreOptions.appendChild(option);
    },
    createKeystoreOptions(keystore) {
      const ids = Object.keys(keystore.toObject().credentials || {});
      keystoreOptions.innerHTML = "";
      ids.forEach((v) => this.addKeystoreOption(v));
    },
    onKeystoreRead(fn) {
      readKeystoreButton.addEventListener("click", async (event) => {
        event.preventDefault();
        if (!keystoreOptions.value) {
          throw Error("No value selected to read from Keystore");
        }
        const credentials = await fn(
          keystoreOptions.value,
          keystorePassword.value
        );
        this.setMembershipInfo(
          credentials.membership.treeIndex,
          credentials.identity,
          keystoreOptions.value
        );
      });
    },
    setKeystoreStatus(text) {
      keystoreStatus.innerText = text;
    },
    onKeystoreImport(fn) {
      importKeystoreBtn.addEventListener("click", (event) => {
        event.preventDefault();
        importKeystoreInput.click();
      });
      importKeystoreInput.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) {
          console.error("No file selected");
          return;
        }
        const text = await file.text();
        fn(text);
      });
    },
    onKeystoreExport(fn) {
      exportKeystore.addEventListener("click", async (event) => {
        event.preventDefault();
        const filename = "keystore.json";
        const text = await fn();
        const file = new File([text], filename, {
          type: "application/json",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = filename;
        link.click();
      });
    },
    // UI for Waku
    setWakuStatus(text) {
      statusDiv.innerText = text;
    },
    setSendingStatus(text) {
      sendingStatusSpan.innerText = text;
    },
    renderMessage(message) {
      messagesList.innerHTML += `<li>${message.msg} - [epoch: ${message.epoch}, proof: ${message.proofState} ]</li>`;
    },
    enableDialButton() {
      dialButton.disabled = false;
    },
    enableChatButtonsIfNickSet() {
      if (nicknameInput.value) {
        textInput.disabled = false;
        sendButton.disabled = false;
      }
    },
    onDial(fn) {
      dialButton.addEventListener("click", async () => {
        const multiaddr = remoteMultiAddrInput.value;

        if (!multiaddr) {
          this.setWakuStatus("Error: No multiaddr provided.");
          return;
        }

        await fn(multiaddr);
        nicknameInput.disabled = false;
      });
    },
    clearMessageArea() {
      textInput.value = null;
      setTimeout(() => {
        this.setSendingStatus("");
      }, 5000);
    },
    onSendMessage(fn) {
      sendButton.addEventListener("click", async () => {
        const nick = nicknameInput.value;
        const text = utils.utf8ToBytes(textInput.value);
        await fn(nick, text);
      });
    },
  };
}

function isSepolia(id) {
  return id === 11155111;
}

function initKeystore(ui) {
  try {
    const text = readLocalKeystore();
    if (!text) {
      ui.setKeystoreStatus("Initialized empty keystore");
      return Keystore.create();
    }
    const keystore = Keystore.fromString(text);
    if (!keystore) {
      throw Error("Failed to create from string");
    }
    ui.setKeystoreStatus("Loaded from localStorage");
    return keystore;
  } catch (err) {
    console.error("Failed to init keystore:", err);
    ui.setKeystoreStatus("Initialized empty keystore");
    return Keystore.create();
  }
}

function readLocalKeystore() {
  return localStorage.getItem("keystore");
}

function saveLocalKeystore(keystore) {
  localStorage.setItem("keystore", keystore.toString());
}
