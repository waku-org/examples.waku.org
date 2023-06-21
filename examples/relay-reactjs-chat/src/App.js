import * as React from "react";
import protobuf from "protobufjs";
import {
  createRelayNode,
  createDecoder,
  createEncoder,
  waitForRemotePeer,
} from "@waku/sdk";

const ContentTopic = `/js-waku-examples/1/chat/proto`;
const Encoder = createEncoder({ contentTopic: ContentTopic });
const Decoder = createDecoder(ContentTopic);

const SimpleChatMessage = new protobuf.Type("SimpleChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint32"))
  .add(new protobuf.Field("text", 2, "string"));

function App() {
  const [waku, setWaku] = React.useState(undefined);
  const [wakuStatus, setWakuStatus] = React.useState("None");
  // Using a counter just for the messages to be different
  const [sendCounter, setSendCounter] = React.useState(0);
  const [messages, setMessages] = React.useState([]);

  React.useEffect(() => {
    if (!!waku) return;
    if (wakuStatus !== "None") return;

    setWakuStatus("Starting");
    (async () => {
      const waku = await createRelayNode({ defaultBootstrap: true });

      setWaku(waku);
      await waku.start();
      setWakuStatus("Connecting");
      await waku.dial(
        "/ip4/0.0.0.0/tcp/8000/ws/p2p/16Uiu2HAmSC4xN3R831RmRiHfWFnyQi4A8kzQEoYS36YLWtSLsL4x"
      );
      // await waitForRemotePeer(waku, ["relay"]);
      setWakuStatus("Ready");
    })();
  }, [waku, wakuStatus]);

  const processIncomingMessage = React.useCallback((wakuMessage) => {
    console.log("Message received", wakuMessage);
    if (!wakuMessage.payload) return;

    const { text, timestamp } = SimpleChatMessage.decode(wakuMessage.payload);

    const time = new Date();

    time.setTime(timestamp);
    const message = { text, timestamp: time };

    setMessages((messages) => {
      return [message].concat(messages);
    });
  }, []);

  React.useEffect(() => {
    if (!waku) return;

    // Pass the content topic to only process messages related to your dApp
    const deleteObserver = waku.relay.subscribe(
      Decoder,
      processIncomingMessage
    );

    // Called when the component is unmounted, see ReactJS doc.
    return deleteObserver;
  }, [waku, wakuStatus, processIncomingMessage]);

  const sendMessageOnClick = () => {
    // Check Waku is started and connected first.
    if (wakuStatus !== "Ready") return;

    sendMessage(`Here is message #${sendCounter}`, waku, new Date()).then(() =>
      console.log("Message sent")
    );

    // For demonstration purposes.
    setSendCounter(sendCounter + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>{wakuStatus}</p>
        <button onClick={sendMessageOnClick} disabled={wakuStatus !== "Ready"}>
          Send Message
        </button>
        <ul>
          {messages.map((msg) => {
            return (
              <li key={msg.timestamp.valueOf()}>
                <p>
                  {msg.timestamp.toString()}: {msg.text}
                </p>
              </li>
            );
          })}
        </ul>
      </header>
    </div>
  );
}

function sendMessage(message, waku, timestamp) {
  const time = timestamp.getTime();

  // Encode to protobuf
  const protoMsg = SimpleChatMessage.create({
    timestamp: time,
    text: message,
  });
  const payload = SimpleChatMessage.encode(protoMsg).finish();

  // Send over Waku Relay
  return waku.relay.send(Encoder, { payload });
}

export default App;
