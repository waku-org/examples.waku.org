import { createContext, useContext } from "react";
import type { WakuLight } from "@waku/interfaces";

export type WakuContextType = {
  waku?: WakuLight;
};

export const WakuContext = createContext<WakuContextType>({ waku: undefined });
export const useWaku = () => useContext(WakuContext);
