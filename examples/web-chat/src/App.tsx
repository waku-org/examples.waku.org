import handleCommand from "./command";
import Room from "./Room";
import { Message } from "./Message";
import { PageDirection, LightNode } from "@waku/interfaces";

import { useWaku, useContentPair } from "@waku/react";

import { useMessages, usePersistentNick } from "./hooks";

const startTime = new Date();
// Only retrieve a week of history
startTime.setTime(Date.now() - 1000 * 60 * 30);
const endTime = new Date();

export default function App() {
  const { node } = useWaku<LightNode>();
  const { decoder } = useContentPair();
  const [messages, pushLocalMessages] = useMessages({
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

  const [nick, setNick] = usePersistentNick();

  const onCommand = (text: string): void => {
    handleCommand(text, node, setNick).then(({ command, response }) => {
      const commandMessages = response.map((msg) => {
        return Message.fromUtf8String(command, msg);
      });
      pushLocalMessages(commandMessages);
    });
  };

  return (
    <div
      className="chat-app"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <Room nick={nick} messages={messages} commandHandler={onCommand} />
    </div>
  );
}
