import React from "react";
import { RLN, RLNEventsNames } from "@/services/rln";
import { useStore } from "./useStore";

type RLNResult = {
  rln: undefined | RLN;
};

export const useRLN = (): RLNResult => {
  const { setAppStatus } = useStore();
  const rlnRef = React.useRef<undefined | RLN>(undefined);

  React.useEffect(() => {
    if (rlnRef.current) {
      return;
    }

    let terminate = false;
    const statusListener = (event: CustomEvent) => {
      setAppStatus(event?.detail);
    };

    const rln = new RLN();

    rln.addEventListener(RLNEventsNames.Status, statusListener);

    const run = async () => {
      if (terminate) {
        return;
      }
      await rln.init();
      rlnRef.current = rln;
    };

    run();
    return () => {
      terminate = true;
      rln.removeEventListener(RLNEventsNames.Status, statusListener);
    };
  }, [rlnRef, setAppStatus]);

  return {
    rln: rlnRef.current,
  };
};
