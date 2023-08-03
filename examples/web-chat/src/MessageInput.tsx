import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { useWaku } from "@waku/react";
import { LightNode } from "@waku/interfaces";
import { MessageInputProps } from "./types";

export default function MessageInput(props: MessageInputProps) {
  const { hasLightPushPeers } = props;
  const { node } = useWaku<LightNode>();

  const [inputText, setInputText] = useState<string>("");
  const [isActive, setActiveButton] = useState<boolean>(false);

  const onMessage = async () => {
    if (props.sendMessage && inputText) {
      try {
        await props.sendMessage(inputText);
      } catch (e) {
        console.error(`Failed to send message: ${e}`);
      }
      setInputText("");
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setInputText(event.target.value);
  };

  const onKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      isActive &&
      event.key === "Enter" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.shiftKey
    ) {
      await onMessage();
    }
  };

  // Enable the button if there are peers available or the user is sending a command
  useEffect(() => {
    if (inputText.startsWith("/") || hasLightPushPeers) {
      setActiveButton(true);
    } else if (node) {
      setActiveButton(false);
    }
  }, [node, inputText, hasLightPushPeers]);

  return (
    <div className="flex p-2">
      <input
        type="text"
        value={inputText}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="flex-grow p-2 border border-gray-300 rounded-l-md"
        placeholder="Type your message..."
      />
      <button
        onClick={onMessage}
        className={`flex-none px-4 py-2 text-white ${
          isActive ? "bg-blue-500" : "bg-blue-300 cursor-not-allowed"
        } rounded-r-md`}
        disabled={!isActive}
      >
        Send
      </button>
    </div>
  );
}
