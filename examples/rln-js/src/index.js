import { initUI } from "./ui";
import { initRLN } from "./rln";
import { initWaku } from "./waku";

async function run() {
  const { onLoaded, onStatusChange, registerEvents } = initUI();
  const { rln, connectWallet } = await initRLN(onStatusChange);
  const { onSend, onSubscribe } = await initWaku({
    rln,
    onStatusChange,
  });

  onLoaded();
  registerEvents({ onSend, onSubscribe, connectWallet });
}

run();
