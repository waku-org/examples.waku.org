import { createRLN, Keystore } from "@waku/rln";
import { randomNumber } from "./utils";
import { SIGNATURE_MESSAGE } from "./const";

export async function initRLN({ onStatusChange }) {
  onStatusChange("Initializing RLN...");

  let rln;
  try {
    rln = await createRLN();
  } catch (err) {
    onStatusChange(`Failed to initialize RLN: ${err}`, "error");
    throw Error(err);
  }

  onStatusChange("RLN initialized", "success");

  const connectWallet = async () => {
    let signer;
    try {
      onStatusChange("Connecting to wallet...");
      signer = await extractMetaMaskSigner();
    } catch (err) {
      onStatusChange(`Failed to access MetaMask: ${err}`, "error");
      throw Error(err);
    }

    try {
      onStatusChange("Connecting to Ethereum...");
      const localKeystore = readLocalKeystore();
      rln.keystore = Keystore.fromString(localKeystore);

      await rln.start({ signer });
    } catch (err) {
      onStatusChange(`Failed to connect to Ethereum: ${err}`, "error");
      throw Error(err);
    }

    onStatusChange("RLN started", "success");
  };

  const registerCredential = async (password) => {
    if (!rln.signer) {
      alert("RLN is not initialized. Try connecting wallet first.");
      return;
    }

    const signature = await rln.signer.signMessage(
      `${SIGNATURE_MESSAGE}. Nonce: ${randomNumber()}`
    );

    const credential = await rln.registerMembership({ signature });
    const hash = await rln.keystore.addCredential(credential, password);

    return { hash, credential };
  };

  const readKeystoreOptions = () => {
    return rln.keystore.keys();
  };

  const readCredential = async (hash, password) => {
    return rln.keystore.readCredential(hash, password);
  };

  const saveLocalKeystore = () => {
    const keystoreStr = rln.keystore.toString();
    localStorage.setItem("keystore", keystoreStr);
    return keystoreStr;
  };

  const importLocalKeystore = (keystoreStr) => {
    rln.keystore = Keystore.fromString(keystoreStr);
  };

  return {
    rln,
    connectWallet,
    registerCredential,
    readKeystoreOptions,
    readCredential,
    saveLocalKeystore,
    importLocalKeystore,
  };
}

function readLocalKeystore() {
  return localStorage.getItem("keystore") || "";
}
