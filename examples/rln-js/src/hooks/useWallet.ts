import React from "react";
import { useStore } from "./useStore";
import { isEthereumEvenEmitterValid } from "@/utils/ethereum";
import { useRLN } from "./useRLN";
import { SIGNATURE_MESSAGE } from "@/constants";
import { SEPOLIA_CONTRACT } from "@waku/rln";
import { StatusEventPayload } from "@/services/rln";

type UseWalletResult = {
  onConnectWallet: () => void;
  onGenerateCredentials: () => void;
  onRegisterCredentials: () => void;
};

export const useWallet = (): UseWalletResult => {
  const { rln } = useRLN();
  const {
    keystorePassword,
    credentials,
    setEthAccount,
    setChainID,
    setCredentials,
    setActiveCredential,
    setActiveMembershipID,
    setAppStatus,
  } = useStore();

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

  const onRegisterCredentials = React.useCallback(async () => {
    if (!credentials || !rln?.rlnContract || !keystorePassword) {
      return;
    }

    try {
      setAppStatus(StatusEventPayload.CREDENTIALS_REGISTERING);
      const membershipInfo = await rln.rlnContract.registerWithKey(credentials);
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
        keystorePassword
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
  }, [
    credentials,
    rln,
    keystorePassword,
    setActiveCredential,
    setActiveMembershipID,
    setAppStatus,
  ]);

  return {
    onConnectWallet,
    onGenerateCredentials,
    onRegisterCredentials,
  };
};

function randomNumber(): number {
  return Math.ceil(Math.random() * 1000);
}
