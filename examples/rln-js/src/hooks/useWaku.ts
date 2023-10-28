import React from "react";
import { waku, Waku, WakuEventsNames } from "@/services/waku";
import { useStore } from "./useStore";
import { useRLN } from "./useRLN";

export const useWaku = () => {
  const messages: string[] = [];
  const wakuRef = React.useRef<Waku>();

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
    };
  }, [activeMembershipID, credentials, rln, setWakuStatus]);

  const onSend = React.useCallback(
    async (nick: string, message: string) => {
      if (!wakuRef.current) {
        return;
      }
      // await wakuRef.current.node?.lightPush.send()
    },
    [wakuRef]
  );

  return { onSend, messages };
};
