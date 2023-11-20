import React from "react";
import { useStore } from "./useStore";
import { useRLN } from "./useRLN";

type UseContractResult = {
  onFetchContract: () => void;
};

export const useContract = (): UseContractResult => {
  const { rln } = useRLN();
  const { setEthAccount, setChainID, setLastMembershipID } = useStore();

  const onFetchContract = React.useCallback(async () => {
    const fetchAccounts = new Promise<void>(async (resolve) => {
      if (!rln) {
        console.log("Cannot fetch wallet, not provider found.");
        resolve();
        return;
      }

      try {
        const accounts = await rln.ethProvider.send("eth_requestAccounts", []);
        setEthAccount(accounts[0] || "");
        const network = await rln.ethProvider.getNetwork();
        setChainID(network.chainId);
      } catch (error) {
        console.error("Failed to connect to account: ", error);
      }
      resolve();
    });

    const fetchContract = new Promise<void>(async (resolve) => {
      if (!rln?.rlnContract || !rln?.rlnInstance) {
        console.log("Cannot fetch contract info, no contract found.");
        resolve();
        return;
      }

      try {
        await rln.rlnContract.fetchMembers(rln.rlnInstance);
        rln.rlnContract.subscribeToMembers(rln.rlnInstance);

        const last = rln.rlnContract.members.at(-1);

        if (last) {
          setLastMembershipID(last.index.toNumber());
        }
      } catch (error) {
        console.error("Failed to fetch contract state: ", error);
      }
      resolve();
    });

    await Promise.any([fetchAccounts, fetchContract]);
  }, [rln, setEthAccount, setChainID, setLastMembershipID]);

  return {
    onFetchContract,
  };
};
