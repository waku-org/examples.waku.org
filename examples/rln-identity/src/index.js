import { initUI } from "./ui";
import { initRLN } from "./rln";

async function run() {
  const { registerEvents, onStatusChange } = initUI();
  const {
    connectWallet,
    registerCredential,
    readKeystoreOptions,
    readCredential,
    saveLocalKeystore,
    importLocalKeystore,
  } = await initRLN({
    onStatusChange,
  });

  registerEvents({
    connectWallet,
    registerCredential,
    readKeystoreOptions,
    readCredential,
    saveLocalKeystore,
    importLocalKeystore,
  });
}

run();
