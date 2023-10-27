import React from "react";
import { useStore } from "./useStore";
import { isEthereumEvenEmitterValid } from "@/utils/ethereum";
import { useRLN } from "./useRLN";
import { SIGNATURE_MESSAGE } from "@/constants";

type UseWalletResult = {
  onConnectWallet: () => void;
  onGenerateCredentials: () => void;
};

export const useWallet = (): UseWalletResult => {
  const { rln } = useRLN();
  const { setEthAccount, setChainID, setCredentials } = useStore();

  React.useEffect(() => {
    const ethereum = window.ethereum;
    if (!isEthereumEvenEmitterValid(ethereum)) {
      console.log("Cannot subscribe to ethereum events.");
      return;
    }

    const onAccountsChanged = (accounts: string[]) => {
      setEthAccount(accounts[0] || "");
    };
    ethereum.on("accountsChanged", onAccountsChanged);

    const onChainChanged = (chainID: string) => {
      const ID = parseInt(chainID, 16);
      setChainID(ID);
    };
    ethereum.on("chainChanged", onChainChanged);

    return () => {
      ethereum.removeListener("chainChanged", onChainChanged);
      ethereum.removeListener("accountsChanged", onAccountsChanged);
    };
  }, [setEthAccount, setChainID]);

  const onConnectWallet = React.useCallback(async () => {
    if (!rln?.ethProvider) {
      console.log("Cannot connect wallet, no provider found.");
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
  }, [rln, setEthAccount, setChainID]);

  const onGenerateCredentials = React.useCallback(async () => {
    if (!rln?.ethProvider) {
      console.log("Cannot generate credentials, no provider found.");
      return;
    }

    const signer = rln.ethProvider.getSigner();
    const signature = await signer.signMessage(
      `${SIGNATURE_MESSAGE}. Nonce: ${randomNumber()}`
    );
    const credentials = await rln.rlnInstance?.generateSeededIdentityCredential(
      signature
    );
    setCredentials(credentials);
  }, [rln, setCredentials]);

  return {
    onConnectWallet,
    onGenerateCredentials,
  };
};

function randomNumber(): number {
  return Math.ceil(Math.random() * 1000);
}
