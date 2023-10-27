import { create } from "zustand";
import { IdentityCredential } from "@waku/rln";

type StoreResult = {
  appStatus: string;
  setAppStatus: (v: string) => void;
  ethAccount: string;
  setEthAccount: (v: string) => void;
  chainID: number;
  setChainID: (v: number) => void;
  lastMembershipID: number;
  setLastMembershipID: (v: number) => void;
  credentials: undefined | IdentityCredential;
  setCredentials: (v: undefined | IdentityCredential) => void;

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

    ethAccount: "",
    setEthAccount: (v: string) => set((state) => ({ ...state, ethAccount: v })),
    chainID: -1,
    setChainID: (v: number) => set((state) => ({ ...state, chainID: v })),
    lastMembershipID: -1,
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
    keystoreStatus: DEFAULT_VALUE,
    setKeystoreStatus: (v: string) =>
      set((state) => ({ ...state, keystoreStatus: v })),
    activeCredential: DEFAULT_VALUE,
    keystoreCredentials: [], // ["277026D55D6F3988FB4E4695F1DCA2F59B012581A854FEE6035EE1566F898908", "59FDF2A610545099326E736269EA2E297BCA0B2BA4D68D245130BF10F9FFAC43", "FC98D3EDD1CCB2AA4C25CCDDD18ADADC8C4BBA9BA11B9F652B2E5E9732D531D3"],
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
