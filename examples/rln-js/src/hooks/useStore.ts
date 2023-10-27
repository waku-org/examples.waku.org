import { create } from "zustand";
import { IdentityCredential } from "@waku/rln";

type StoreResult = {
  appStatus: string;
  setAppStatus: (v: string) => void;
  ethAccount: string;
  setEthAccount: (v: string) => void;
  chainID: undefined | number;
  setChainID: (v: number) => void;
  lastMembershipID: undefined | number;
  setLastMembershipID: (v: number) => void;
  credentials: undefined | IdentityCredential;
  setCredentials: (v: undefined | IdentityCredential) => void;

  activeCredential: string;
  keystoreCredentials: string[];
  setKeystoreCredentials: (v: string[]) => void;
  setActiveCredential: (v: string) => void;
  activeMembershipID: undefined | number;
  setActiveMembershipID: (v: number) => void;

  wakuStatus: string;
  setWakuStatus: (v: string) => void;
};

const DEFAULT_VALUE = "none";

export const useStore = create<StoreResult>((set) => {
  const generalModule = {
    appStatus: DEFAULT_VALUE,
    setAppStatus: (v: string) => set((state) => ({ ...state, appStatus: v })),

    ethAccount: "",
    setEthAccount: (v: string) => set((state) => ({ ...state, ethAccount: v })),
    chainID: undefined,
    setChainID: (v: number) => set((state) => ({ ...state, chainID: v })),
    lastMembershipID: undefined,
    setLastMembershipID: (v: number) =>
      set((state) => ({ ...state, lastMembershipID: v })),
    credentials: undefined,
    setCredentials: (v: undefined | IdentityCredential) =>
      set((state) => ({ ...state, credentials: v })),
  };

  const wakuModule = {
    wakuStatus: DEFAULT_VALUE,
    setWakuStatus: (v: string) =>
      set((state) => ({ ...state, keystoreStatus: v })),
  };

  const keystoreModule = {
    activeCredential: DEFAULT_VALUE,
    setActiveCredential: (v: string) =>
      set((state) => ({ ...state, activeCredential: v })),
    keystoreCredentials: [],
    setKeystoreCredentials: (v: string[]) =>
      set((state) => ({ ...state, keystoreCredentials: v })),
    activeMembershipID: undefined,
    setActiveMembershipID: (v: number) =>
      set((state) => ({ ...state, activeMembershipID: v })),
  };

  return {
    ...generalModule,
    ...wakuModule,
    ...keystoreModule,
  };
});
