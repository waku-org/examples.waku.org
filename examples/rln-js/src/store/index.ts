import { create } from "zustand";

type StoreResult = {
  appStatus: string;
  setAppStatus: (v: string) => void;
  keystoreStatus: string;
  setKeystoreStatus: (v: string) => void;
  wakuStatus: string;
  setWakuStatus: (v: string) => void;
};

const DEFAULT_VALUE = "none";

export const useStore = create<StoreResult>((set) => ({
  appStatus: DEFAULT_VALUE,
  setAppStatus: (v: string) => set((state) => ({ ...state, appStatus: v })),

  keystoreStatus: DEFAULT_VALUE,
  setKeystoreStatus: (v: string) =>
    set((state) => ({ ...state, keystoreStatus: v })),

  wakuStatus: DEFAULT_VALUE,
  setWakuStatus: (v: string) =>
    set((state) => ({ ...state, keystoreStatus: v })),
}));
