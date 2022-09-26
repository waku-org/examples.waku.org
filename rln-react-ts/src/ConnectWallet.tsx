import Button from "@mui/material/Button";
import React from "react";
import { ethers } from "ethers";

declare let window: any;

interface Props {
  setAddress: (address: string) => void;
  setProvider: (provider: ethers.providers.Web3Provider) => void;
}

export default function ConnectWallet({ setAddress, setProvider }: Props) {
  const connectWallet = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      setProvider(provider);
    } catch (e) {
      console.error("No web3 provider available", e);
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={connectWallet}>
      Connect Wallet
    </Button>
  );
}
