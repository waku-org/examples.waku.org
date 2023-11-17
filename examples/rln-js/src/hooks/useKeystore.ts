import React from "react";
import { useStore } from "./useStore";
import { useRLN } from "./useRLN";
import { SEPOLIA_CONTRACT } from "@waku/rln";
import { StatusEventPayload } from "@/constants";

type UseKeystoreResult = {
  onReadCredentials: (hash: string, password: string) => void;
  onRegisterCredentials: (password: string) => void;
};

export const useKeystore = (): UseKeystoreResult => {
  const { rln } = useRLN();
  const {
    credentials,
    setActiveCredential,
    setActiveMembershipID,
    setAppStatus,
    setCredentials,
  } = useStore();

  const onRegisterCredentials = React.useCallback(
    async (password: string) => {
      if (!credentials || !rln?.rlnContract || !password) {
        return;
      }

      try {
        setAppStatus(StatusEventPayload.CREDENTIALS_REGISTERING);
        const membershipInfo = await rln.rlnContract.registerWithKey(
          credentials
        );
        const membershipID = membershipInfo!.index.toNumber();
        const keystoreHash = await rln.keystore.addCredential(
          {
            membership: {
              treeIndex: membershipID,
              chainId: SEPOLIA_CONTRACT.chainId,
              address: SEPOLIA_CONTRACT.address,
            },
            identity: credentials,
          },
          password
        );
        setActiveCredential(keystoreHash);
        setActiveMembershipID(membershipID);
        rln.saveKeystore();
        setAppStatus(StatusEventPayload.CREDENTIALS_REGISTERED);
      } catch (error) {
        setAppStatus(StatusEventPayload.CREDENTIALS_FAILURE);
        console.error("Failed to register to RLN Contract: ", error);
        return;
      }
    },
    [credentials, rln, setActiveCredential, setActiveMembershipID, setAppStatus]
  );

  const onReadCredentials = React.useCallback(
    async (hash: string, password: string) => {
      if (!rln || !hash || !password) {
        return;
      }

      try {
        const record = await rln.keystore.readCredential(hash, password);
        if (record) {
          setCredentials(record.identity);
          setActiveCredential(hash);
          setActiveMembershipID(record.membership.treeIndex);
        }
      } catch (error) {
        console.error("Failed to read credentials from Keystore.");
        return;
      }
    },
    [rln, setActiveCredential, setActiveMembershipID, setCredentials]
  );

  return {
    onRegisterCredentials,
    onReadCredentials,
  };
};
