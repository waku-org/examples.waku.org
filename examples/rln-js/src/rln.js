import { ethers } from "ethers";

import {
  create,
  RLNEncoder,
  RLNDecoder,
  RLNContract,
  SEPOLIA_CONTRACT,
} from "@waku/rln";
import { createEncoder, createDecoder } from "@waku/sdk";

import { CONTENT_TOPIC, MEMBERSHIP_ID, RLN_CREDENTIALS } from "./const";

export async function initRLN(onStatusChange) {
  onStatusChange("Connecting to wallet...");
  const ethereum = window.ethereum;
  if (!ethereum) {
    const err =
      "Missing or invalid Ethereum provider. Please install MetaMask.";
    onStatusChange(err, "error");
    throw Error(err);
  }
  try {
    await ethereum.request({ method: "eth_requestAccounts" });
  } catch (err) {
    onStatusChange("Failed to access MetaMask", "error");
    throw Error(err);
  }
  const provider = new ethers.providers.Web3Provider(ethereum, "any");

  onStatusChange("Initializing RLN...");
  let rlnInstance, rlnContract;
  try {
    rlnInstance = await create();
    rlnContract = await RLNContract.init(rlnInstance, {
      registryAddress: SEPOLIA_CONTRACT.address,
      provider: provider.getSigner(),
    });
  } catch (err) {
    onStatusChange("Failed to initialize RLN", "error");
    throw Error(err);
  }
  const encoder = new RLNEncoder(
    createEncoder({
      ephemeral: false,
      contentTopic: CONTENT_TOPIC,
    }),
    rlnInstance,
    MEMBERSHIP_ID,
    RLN_CREDENTIALS
  );
  const decoder = new RLNDecoder(rlnInstance, createDecoder(CONTENT_TOPIC));

  onStatusChange("RLN initialized", "success");

  return {
    encoder,
    decoder,
    rlnContract,
  };
}
