import { createLightNode, waitForRemotePeer } from "@waku/sdk";

import { ProtoChatMessage } from "./const";

export async function initWaku({
  encoder,
  decoder,
  rlnContract,
  onStatusChange,
}) {
  onStatusChange("Initializing Waku...");
  const node = await createLightNode({
    defaultBootstrap: true,
  });
  onStatusChange("Waiting for peers");
  await node.start();
  await waitForRemotePeer(node);

  const onSend = async (nick, text) => {
    const timestamp = new Date();
    const msg = ProtoChatMessage.create({
      text,
      nick,
      timestamp: Math.floor(timestamp.valueOf() / 1000),
    });
    const payload = ProtoChatMessage.encode(msg).finish();
    console.log("Sending message with proof...");

    const res = await node.lightPush.send(encoder, { payload, timestamp });
    console.log("Message sent:", res);
  };

  onStatusChange("Subscribing to content topic...");
  const subscription = await node.filter.createSubscription();
  const onSubscribe = async (cb) => {
    await subscription.subscribe(decoder, (message) => {
      try {
        const { timestamp, nick, text } = ProtoChatMessage.decode(
          message.payload
        );

        let proofStatus = "no proof";
        if (message.rateLimitProof) {
          console.log("Proof received: ", message.rateLimitProof);

          try {
            console.time("Proof verification took:");
            const res = message.verify(rlnContract.roots());
            console.timeEnd("Proof verification took:");
            proofStatus = res ? "verified" : "not verified";
          } catch (error) {
            proofStatus = "invalid";
            console.error("Failed to verify proof: ", error);
          }
        }

        console.log({
          nick,
          text,
          proofStatus,
          time: new Date(timestamp).toDateString(),
        });
        cb(nick, text, timestamp, proofStatus);
      } catch (error) {
        console.error("Failed in subscription listener: ", error);
      }
    });
  };

  onStatusChange("Waku initialized", "success");

  return {
    onSend,
    onSubscribe,
  };
}
