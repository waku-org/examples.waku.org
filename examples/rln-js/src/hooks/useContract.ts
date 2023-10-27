import React from "react";
import { useStore } from "./useStore";
import { useRLN } from "./useRLN";

type UseContractResult = {
  onFetchContract: () => void;
};

export const useContract = (): UseContractResult => {
  const { rln } = useRLN();
  const { setLastMembershipID } = useStore();

  const onFetchContract = React.useCallback(async () => {
    if (!rln?.rlnContract || !rln?.rlnInstance) {
      console.log("Cannot fetch contract info, no contract found.");
      return;
    }

    // disable button
    await rln.rlnContract.fetchMembers(rln.rlnInstance);
    // enable button
    rln.rlnContract.subscribeToMembers(rln.rlnInstance);

    const last = rln.rlnContract.members.at(-1);

    if (last) {
      setLastMembershipID(last.index.toNumber());
    }
  }, [rln, setLastMembershipID]);

  return {
    onFetchContract,
  };
};
