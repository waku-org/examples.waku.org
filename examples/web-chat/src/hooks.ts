import React, { useEffect, useState } from "react";
import { generate } from "server-name-generator";
import { Message } from "./Message";
import { Decoder } from "@waku/core/lib/message/version_0";
import { LightNode, StoreQueryOptions } from "@waku/interfaces";

import { useFilterMessages, useStoreMessages } from "@waku/react";

export const usePersistentNick = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>
] => {
  const [nick, setNick] = useState<string>(() => {
    const persistedNick = window.localStorage.getItem("nick");
    return persistedNick !== null ? persistedNick : generate();
  });
  useEffect(() => {
    localStorage.setItem("nick", nick);
  }, [nick]);

  return [nick, setNick];
};

type UseMessagesParams = {
  node: undefined | LightNode;
  decoder: Decoder;
  options: StoreQueryOptions;
};

export const useMessages = (params: UseMessagesParams): Message[] => {
  const { messages: newMessages } = useFilterMessages(params);
  const { messages: storedMessages } = useStoreMessages(params);

  return React.useMemo((): Message[] => {
    return [...storedMessages, ...newMessages]
      .map(Message.fromWakuMessage)
      .filter((v): v is Message => !!v);
  }, [storedMessages, newMessages]);
};
