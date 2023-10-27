"use client";
import React from "react";
import { rln, RLN, RLNEventsNames } from "@/services/rln";
import { useStore } from "./useStore";

type RLNResult = {
  rln: undefined | RLN;
};

export const useRLN = (): RLNResult => {
  const { setAppStatus, setKeystoreCredentials } = useStore();
  const rlnRef = React.useRef<undefined | RLN>(undefined);

  React.useEffect(() => {
    if (rlnRef.current || !rln) {
      return;
    }

    let terminate = false;

    const statusListener = (event: CustomEvent) => {
      setAppStatus(event?.detail);
    };
    rln.addEventListener(RLNEventsNames.Status, statusListener);

    const keystoreListener = (event: CustomEvent) => {
      setKeystoreCredentials(event?.detail || []);
    };
    rln.addEventListener(RLNEventsNames.Keystore, keystoreListener);

    const run = async () => {
      if (terminate) {
        return;
      }
      await rln?.init();
      rlnRef.current = rln;
    };

    run();
    return () => {
      terminate = true;
      rln?.removeEventListener(RLNEventsNames.Status, statusListener);
      rln?.removeEventListener(RLNEventsNames.Keystore, keystoreListener);
    };
  }, [rlnRef, setAppStatus]);

  return {
    rln: rlnRef.current,
  };
};
