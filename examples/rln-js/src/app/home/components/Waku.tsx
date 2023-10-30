import React from "react";
import { Block } from "@/components/Block";
import { Subtitle } from "@/components/Subtitle";
import { Status } from "@/components/Status";
import { Button } from "@/components/Button";
import { useStore, useWaku } from "@/hooks";
import { MessageContent } from "@/services/waku";

export const Waku: React.FunctionComponent<{}> = () => {
  const { wakuStatus } = useStore();
  const { onSend, messages } = useWaku();

  const { nick, text, onNickChange, onMessageChange, resetText } = useMessage();

  const onSendClick = async () => {
    await onSend(nick, text);
    resetText();
  };

  const renderedMessages = React.useMemo(
    () => messages.map(renderMessage),
    [messages]
  );

  return (
    <Block className="mt-10">
      <Subtitle>
        Waku<p className="text-xs">(select credentials to initialize)</p>
      </Subtitle>
      <Status text="Waku status" mark={wakuStatus} />

      <Block className="mt-4">
        <label
          htmlFor="nick-input"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Your nickname
        </label>
        <input
          type="text"
          id="nick-input"
          placeholder="Choose a nickname"
          value={nick}
          onChange={onNickChange}
          className="w-full mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </Block>

      <Block className="mt-4">
        <Block className="mb-2">
          <label
            htmlFor="message-input"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Message
          </label>
          <input
            type="text"
            id="message-input"
            value={text}
            onChange={onMessageChange}
            placeholder="Text your message here"
            className="w-full mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </Block>
        <Button onClick={onSendClick}>Send</Button>
      </Block>

      <Block className="mt-8">
        <p className="text-l mb-4">Messages</p>
        <div>
          <ul>{renderedMessages}</ul>
        </div>
      </Block>
    </Block>
  );
};

function useMessage() {
  const [nick, setNick] = React.useState<string>("");
  const [text, setText] = React.useState<string>("");

  const onNickChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setNick(e.currentTarget.value || "");
  };

  const onMessageChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setText(e.currentTarget.value || "");
  };

  const resetText = () => {
    setText("");
  };

  return {
    nick,
    text,
    resetText,
    onNickChange,
    onMessageChange,
  };
}

function renderMessage(content: MessageContent) {
  return (
    <li key={`${content.nick}-${content.time}`} className="mb-4">
      <p>
        <span className="text-lg">{content.nick}</span>
        <span className="text-sm font-bold">
          ({content.proofStatus}, {content.time})
        </span>
        :
      </p>
      <p>{content.text}</p>
    </li>
  );
}
