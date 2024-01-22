import { initUI } from "./ui";
import { initRLN } from "./rln";
import { initWaku } from "./waku";

/**
Keystore: easy way to import or hardcode credentials


Metamask:
- abstraction to get provider with triggering dialog from Metamask
- default: true - embed such abstraction into RLN initialization by default
- default: false - read provider from options.provider


RLN Instance:
- create and RLNContract are the same;
- RLNEncoder and RLNDecoder should be just createDecoder and createEncoder and use the one from Waku inside;


Verification:
- embed verification into RLNDecoder
    reduce: const res = message.verify(rlnContract.roots());
- fix the problem with double proof generation
    in preparePushMessage
 */

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
