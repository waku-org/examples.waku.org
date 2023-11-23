"use client";

import React from "react";
import { waku, Waku, WakuEvents } from "@/services/waku";
import { WakuStatus } from "@/const";
import { Loading } from "./Loading";

type WakuContextProps = {
  status: WakuStatus;
  waku?: Waku;
};

const WakuContext = React.createContext<WakuContextProps>({
  status: WakuStatus.Initializing,
  waku: undefined,
});

type WakuProviderProps = {
  children: React.ReactNode;
};

export const useWaku = () => {
  const { status, waku } = React.useContext(WakuContext);

  return { status, waku };
};

export const WakuProvider = (props: WakuProviderProps) => {
  const wakuRef = React.useRef<Waku>();
  const [status, setStatus] = React.useState<WakuStatus>(
    WakuStatus.Initializing
  );

  React.useEffect(() => {
    if (wakuRef.current) {
      return;
    }

    const statusListener = (event: CustomEvent) => {
      setStatus(event.detail);
    };
    waku.addEventListener(WakuEvents.Status, statusListener);

    waku.init().then(() => {
      wakuRef.current = waku;
    });
    return () => {
      waku.removeEventListener(WakuEvents.Status, statusListener);
    };
  }, [wakuRef, setStatus]);

  if (status === WakuStatus.Failed) {
    return <>{status}</>;
  }

  if (status !== WakuStatus.Connected) {
    return <Loading />;
  }

  return (
    <WakuContext.Provider value={{ status, waku: wakuRef.current }}>
      {props.children}
    </WakuContext.Provider>
  );
};
