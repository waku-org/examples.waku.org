import { initUI } from "./ui";
import { initRLN } from "./rln";
import { initWaku } from "./waku";

async function run() {
  const { onLoaded, onStatusChange, registerEvents } = initUI();
  const { encoder, decoder, rlnContract } = await initRLN(onStatusChange);
  const { onSend, onSubscribe } = await initWaku({
    encoder,
    decoder,
    rlnContract,
    onStatusChange,
  });

  onLoaded();
  registerEvents({ onSend, onSubscribe });
}

run();
