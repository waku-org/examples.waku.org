import React from "react";
import { waku, Waku, WakuEventsNames, MessageContent } from "@/services/waku";
import { useStore } from "./useStore";
import { useRLN } from "./useRLN";

export const useWaku = () => {
  const wakuRef = React.useRef<Waku>();
  const [messages, setMessages] = React.useState<MessageContent[]>([]);

  const { rln } = useRLN();
  const { activeMembershipID, credentials, setWakuStatus } = useStore();

  React.useEffect(() => {
    if (!credentials || !activeMembershipID || !rln) {
      return;
    }

    const statusListener = (event: CustomEvent) => {
      setWakuStatus(event.detail || "");
    };
    waku.addEventListener(WakuEventsNames.Status, statusListener);

    const messagesListener = (event: CustomEvent) => {
      setMessages((prev) => [...prev, event.detail as MessageContent]);
    };
    waku.addEventListener(WakuEventsNames.Message, messagesListener);

    let terminated = false;
    const run = async () => {
      if (terminated) {
        return;
      }

      const options = {
        rln,
        credentials,
        membershipID: activeMembershipID,
      };

      if (!wakuRef.current) {
        await waku.init(options);
        wakuRef.current = waku;
      } else {
        wakuRef.current.initEncoder(options);
      }
    };

    run();
    return () => {
      terminated = true;
      waku.removeEventListener(WakuEventsNames.Status, statusListener);
      waku.removeEventListener(WakuEventsNames.Message, messagesListener);
    };
  }, [activeMembershipID, credentials, rln, setWakuStatus]);

  const onSend = React.useCallback(
    async (nick: string, text: string) => {
      if (!wakuRef.current) {
        return;
      }
      await wakuRef.current.sendMessage(nick, text);
    },
    [wakuRef]
  );

  return { onSend, messages };
};
