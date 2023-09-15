import { useEffect, useRef } from "react";
import { Message } from "./Message";
import type { ChatListProps } from "./types";

export default function ChatList(props: ChatListProps) {
  const renderedMessages = props.messages.array.map((message) => (
    <div
      key={
        message.nick +
        message.payloadAsUtf8 +
        message.timestamp.valueOf() +
        message.sentTimestamp?.valueOf()
      }
      className="flex flex-col p-2 border-b border-gray-200"
    >
      <span className="text-sm text-gray-500">{message.nick}</span>
      <span className="text-sm text-gray-500">
        {formatDisplayDate(message)}
      </span>
      <p className="text-gray-700">{message.payloadAsUtf8}</p>
    </div>
  ));

  return (
    <div className="overflow-y-auto h-full">
      {renderedMessages}
      <AlwaysScrollToBottom messages={props.messages.array} />
    </div>
  );
}

function formatDisplayDate(message: Message): string {
  return message.timestamp.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

const AlwaysScrollToBottom = (props: { messages: Message[] }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView();
    }
  }, [props.messages]);

  return <div ref={elementRef} />;
};
