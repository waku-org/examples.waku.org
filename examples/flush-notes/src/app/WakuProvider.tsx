"use client";

import React from "react";
import { waku, Waku, WakuEvents } from "@/services/waku";

type WakuContextProps = {
  status: string;
};

const WakuContext = React.createContext<WakuContextProps>({
  status: "",
});

type WakuProviderProps = {
  children: React.ReactNode;
};

export const useWaku = () => {
  const { status } = React.useContext(WakuContext);

  return { status };
};

export const WakuProvider = (props: WakuProviderProps) => {
  const wakuRef = React.useRef<Waku>();
  const [status, setStatus] = React.useState<string>("");

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

  return (
    <WakuContext.Provider value={{ status }}>
      {props.children}
    </WakuContext.Provider>
  );
};
