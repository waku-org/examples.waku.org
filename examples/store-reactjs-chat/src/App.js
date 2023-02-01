import * as React from "react";
import protobuf from "protobufjs";
import { createLightNode } from "@waku/create";
import { waitForRemotePeer } from "@waku/core";
import { Decoder } from "@waku/core/lib/message/version_0";
import { bytesToUtf8 } from "@waku/byte-utils";

const ContentTopic = "/toy-chat/2/huilong/proto";
const decoder = new Decoder(ContentTopic);

const ProtoChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("nick", 2, "string"))
  .add(new protobuf.Field("text", 3, "bytes"));

function App() {
  const [waku, setWaku] = React.useState(undefined);
  const [wakuStatus, setWakuStatus] = React.useState("None");
  const [messages, setMessages] = React.useState([]);

  React.useEffect(() => {
    if (wakuStatus !== "None") return;

    setWakuStatus("Starting");

    createLightNode({ defaultBootstrap: true }).then((waku) => {
      waku.start().then(() => {
        setWaku(waku);
        setWakuStatus("Connecting");
      });
    });
  }, [waku, wakuStatus]);

  React.useEffect(() => {
    if (!waku) return;

    // We do not handle disconnection/re-connection in this example
    if (wakuStatus === "Connected") return;

    waitForRemotePeer(waku, ["store"]).then(() => {
      // We are now connected to a store node
      setWakuStatus("Connected");
    });
  }, [waku, wakuStatus]);

  React.useEffect(() => {
    if (wakuStatus !== "Connected") return;

    (async () => {
      const startTime = new Date();
      // 7 days/week, 24 hours/day, 60min/hour, 60secs/min, 100ms/sec
      startTime.setTime(startTime.getTime() - 7 * 24 * 60 * 60 * 1000);

      // TODO: Remove this timeout once https://github.com/status-im/js-waku/issues/913 is done
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        for await (const messagesPromises of waku.store.queryGenerator(
          [decoder],
          {
            timeFilter: { startTime, endTime: new Date() },
            pageDirection: "forward",
          }
        )) {
          const messages = await Promise.all(
            messagesPromises
              .map(async (p) => {
                const msg = await p;
                return decodeMessage(msg);
              })
              .filter(Boolean)
          );

          setMessages((currentMessages) => {
            return currentMessages.concat(messages.reverse());
          });
        }
      } catch (e) {
        console.log("Failed to retrieve messages", e);
        setWakuStatus("Error Encountered");
      }
    })();
  }, [waku, wakuStatus]);

  return (
    <div className="App">
      <header className="App-header">
        <h2>{wakuStatus}</h2>
        <h3>Messages</h3>
        <ul>
          <Messages messages={messages} />
        </ul>
      </header>
    </div>
  );
}

export default App;

function decodeMessage(wakuMessage) {
  if (!wakuMessage.payload) return;

  const { timestamp, nick, text } = ProtoChatMessage.decode(
    wakuMessage.payload
  );

  if (!timestamp || !text || !nick) return;

  const time = new Date();
  time.setTime(Number(timestamp));

  const utf8Text = bytesToUtf8(text);

  return {
    text: utf8Text,
    timestamp: time,
    nick,
    timestampInt: wakuMessage.timestamp,
  };
}

function Messages(props) {
  return props.messages.map(({ text, timestamp, nick, timestampInt }) => {
    return (
      <li key={timestampInt}>
        ({formatDate(timestamp)}) {nick}: {text}
      </li>
    );
  });
}

function formatDate(timestamp) {
  return timestamp.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
