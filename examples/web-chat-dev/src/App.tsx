import "./App.css";
import Room from "./Room";
import { PageDirection, LightNode } from "@waku/interfaces";

import { useWaku, useContentPair } from "@waku/react";

import { useMessages, usePersistentNick } from "./hooks";

const startTime = new Date();
// Only retrieve a week of history
startTime.setTime(Date.now() - 1000 * 60 * 60 * 24 * 7);
const endTime = new Date();

export default function App() {
  const { node } = useWaku<LightNode>();
  const { decoder } = useContentPair();
  const [messages] = useMessages({
    node,
    decoder,
    options: {
      pageSize: 5,
      pageDirection: PageDirection.FORWARD,
      timeFilter: {
        startTime,
        endTime,
      },
    },
  });

  const [nick] = usePersistentNick();

  return (
    <div
      className="chat-app"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <Room nick={nick} messages={messages} />
    </div>
  );
}
