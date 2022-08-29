import "@ethersproject/shims";

import { PublicKeyMessage } from "./messaging/wire";
import { generatePrivateKey, getPublicKey, utils } from "js-waku";
import { PublicKeyContentTopic } from "./waku";
import { keccak256, _TypedDataEncoder, recoverAddress } from "ethers/lib/utils";
import { equals } from "uint8arrays/equals";
import type { TypedDataSigner } from "@ethersproject/abstract-signer";

export const PublicKeyMessageEncryptionKey = utils.hexToBytes(
  keccak256(utils.utf8ToBytes(PublicKeyContentTopic))
);

export interface KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

/**
 * Generate new encryption key pair.
 */
export async function generateEncryptionKeyPair(): Promise<KeyPair> {
  const privateKey = generatePrivateKey();
  const publicKey = getPublicKey(privateKey);
  return { privateKey, publicKey };
}

/**
 * Sign the encryption public key with Web3. This can then be published to let other
 * users know to use this encryption public key to encrypt messages for the
 * Ethereum Address holder.
 */
export async function createPublicKeyMessage(
  address: string,
  encryptionPublicKey: Uint8Array,
  signer: TypedDataSigner
): Promise<PublicKeyMessage> {
  const signature = await signEncryptionKey(
    encryptionPublicKey,
    address,
    signer
  );

  console.log("Asking wallet to sign Public Key Message");
  console.log("Public Key Message signed");

  return new PublicKeyMessage({
    encryptionPublicKey: encryptionPublicKey,
    ethAddress: utils.hexToBytes(address),
    signature: utils.hexToBytes(signature),
  });
}

function buildMsgParams(encryptionPublicKey: Uint8Array, fromAddress: string) {
  return {
    domain: {
      name: "Ethereum Private Message over Waku",
      version: "1",
    },
    value: {
      message:
        "By signing this message you certify that messages addressed to `ownerAddress` must be encrypted with `encryptionPublicKey`",
      encryptionPublicKey: utils.bytesToHex(encryptionPublicKey),
      ownerAddress: fromAddress,
    },
    // Refers to the keys of the *types* object below.
    primaryType: "PublishEncryptionPublicKey",
    types: {
      PublishEncryptionPublicKey: [
        { name: "message", type: "string" },
        { name: "encryptionPublicKey", type: "string" },
        { name: "ownerAddress", type: "string" },
      ],
    },
  };
}

export async function signEncryptionKey(
  encryptionPublicKey: Uint8Array,
  fromAddress: string,
  signer: TypedDataSigner
): Promise<Uint8Array> {
  const { domain, types, value } = buildMsgParams(
    encryptionPublicKey,
    fromAddress
  );

  const result = await signer._signTypedData(domain, types, value);

  console.log("TYPED SIGNED:" + JSON.stringify(result));

  return utils.hexToBytes(result);
}

/**
 * Validate that the Encryption Public Key was signed by the holder of the given Ethereum address.
 */
export function validatePublicKeyMessage(msg: PublicKeyMessage): boolean {
  const { domain, types, value } = buildMsgParams(
    msg.encryptionPublicKey,
    "0x" + utils.bytesToHex(msg.ethAddress)
  );

  try {
    const hash = _TypedDataEncoder.hash(domain, types, value);

    const recovered = recoverAddress(hash, msg.signature);
    console.log("Recovered", recovered);
    console.log("ethAddress", "0x" + utils.bytesToHex(msg.ethAddress));

    return equals(utils.hexToBytes(recovered), msg.ethAddress);
  } catch (e) {
    console.error("Could not recover public key from signature", e);
    return false;
  }
}
