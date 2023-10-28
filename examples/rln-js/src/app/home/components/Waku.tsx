import React from "react";
import { Block, BlockTypes } from "@/components/Block";
import { Subtitle } from "@/components/Subtitle";
import { Status } from "@/components/Status";
import { Button } from "@/components/Button";
import { useStore, useWaku } from "@/hooks";

const DEFAULT_MA =
  "/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm";

export const Waku: React.FunctionComponent<{}> = () => {
  const { wakuStatus } = useStore();
  const { onDial, onSend, messages } = useWaku();

  const { multiaddr, onMultiaddrChange } = useMultiaddr();
  const { nick, message, onNickChange, onMessageChange } = useMessage();

  const renderedMessages = React.useMemo(
    () => messages.map(renderMessage),
    [messages]
  );

  return (
    <Block className="mt-10">
      <Subtitle>Waku</Subtitle>
      <Status text="Waku status" mark={wakuStatus} />

      <Block className="mt-4">
        <label
          htmlFor="remote-multiaddr"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Password(used for reading/saving into Keystore)
        </label>
        <Block type={BlockTypes.FlexHorizontal}>
          <input
            type="text"
            value={multiaddr}
            id="remote-multiaddr"
            onChange={onMultiaddrChange}
            className="w-full mb-2 mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          <Button className="mb-2" onClick={() => onDial(multiaddr)}>
            Dial
          </Button>
        </Block>
      </Block>

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
            value={message}
            onChange={onMessageChange}
            placeholder="Text your message here"
            className="w-full mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </Block>
        <Button onClick={() => onSend({ nick, message })}>Send</Button>
      </Block>

      <Block className="mt-4">
        <p className="text-l mb-4">Messages</p>
        <div>
          <ul>{renderedMessages}</ul>
        </div>
      </Block>
    </Block>
  );
};

function useMultiaddr() {
  const [multiaddr, setMultiaddr] = React.useState<string>(DEFAULT_MA);

  const onMultiaddrChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setMultiaddr(e.currentTarget.value || "");
  };

  return {
    multiaddr,
    onMultiaddrChange,
  };
}

function useMessage() {
  const [nick, setNick] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("");

  const onNickChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setNick(e.currentTarget.value || "");
  };

  const onMessageChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setMessage(e.currentTarget.value || "");
  };

  return {
    nick,
    message,
    onNickChange,
    onMessageChange,
  };
}

function renderMessage() {
  /*
  wakuMessage.proofState = !!wakuMessage.rateLimitProof
      ? "verifying..."
      : "no proof attached";

    wakuMessage.msg = `
            (${nick})
            <strong>${utils.bytesToUtf8(text)}</strong>
            <i>[${time.toISOString()}]</i>
        `;
        messagesList.innerHTML += `<li>${message.msg} - [epoch: ${message.epoch}, proof: ${message.proofState} ]</li>`;
  */
  return <></>;
}
