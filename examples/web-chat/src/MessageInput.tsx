import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { useWaku } from "@waku/react";
import { LightNode } from "@waku/interfaces";
import {
  TextInput,
  TextComposer,
  Row,
  Fill,
  Fit,
  SendButton,
} from "@livechat/ui-kit";

interface Props {
  sendMessage: ((msg: string) => Promise<void>) | undefined;
}

export default function MessageInput(props: Props) {
  const [inputText, setInputText] = useState<string>("");
  const [activeButton, setActiveButton] = useState<boolean>(false);
  const { node } = useWaku<LightNode>();

  const sendMessage = async () => {
    if (props.sendMessage) {
      await props.sendMessage(inputText);
      setInputText("");
    }
  };

  const messageHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const keyPressHandler = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.shiftKey
    ) {
      await sendMessage();
    }
  };

  // Enable the button if there are peers available or the user is sending a command
  useEffect(() => {
    if (inputText.startsWith("/")) {
      setActiveButton(true);
    } else if (node) {
      (async () => {
        const peers = await node.lightPush.peers();
        if (!!peers) {
          setActiveButton(true);
        } else {
          setActiveButton(false);
        }
      })();
    }
  }, [activeButton, inputText, node]);

  return (
    <TextComposer
      onKeyDown={keyPressHandler}
      onChange={messageHandler}
      active={activeButton}
      onButtonClick={sendMessage}
    >
      <Row align="center">
        <Fill>
          <TextInput value={inputText} />
        </Fill>
        <Fit>
          <SendButton />
        </Fit>
      </Row>
    </TextComposer>
  );
}
