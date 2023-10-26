import { create } from "zustand";

type StoreResult = {
  appStatus: string;
  setAppStatus: (v: string) => void;

  keystoreStatus: string;
  setKeystoreStatus: (v: string) => void;
  activeCredential: string;
  keystoreCredentials: string[];
  setKeystoreCredentials: (v: string[]) => void;
  setActiveCredential: (v: string) => void;

  wakuStatus: string;
  setWakuStatus: (v: string) => void;
};

const DEFAULT_VALUE = "none";

export const useStore = create<StoreResult>((set) => {
  const generalModule = {
    appStatus: DEFAULT_VALUE,
    setAppStatus: (v: string) => set((state) => ({ ...state, appStatus: v })),
  };

  const wakuModule = {
    wakuStatus: DEFAULT_VALUE,
    setWakuStatus: (v: string) =>
      set((state) => ({ ...state, keystoreStatus: v })),
  };

  const keystoreModule = {
    keystoreStatus: DEFAULT_VALUE,
    setKeystoreStatus: (v: string) =>
      set((state) => ({ ...state, keystoreStatus: v })),
    activeCredential: DEFAULT_VALUE,
    keystoreCredentials: [],
    setActiveCredential: (v: string) =>
      set((state) => ({ ...state, activeCredential: v })),
    setKeystoreCredentials: (v: string[]) =>
      set((state) => ({ ...state, keystoreCredentials: v })),
  };

  return {
    ...generalModule,
    ...wakuModule,
    ...keystoreModule,
  };
});
