import { Button } from "@material-ui/core";
import React, { useState } from "react";
import {
  createPublicKeyMessage,
  KeyPair,
  PublicKeyMessageEncryptionKey,
} from "./crypto";
import { PublicKeyMessage } from "./messaging/wire";
import type { WakuPrivacy } from "js-waku/lib/interfaces";
import { SymEncoder } from "js-waku/lib/waku_message/version_1";
import { PublicKeyContentTopic } from "./waku";
import type { TypedDataSigner } from "@ethersproject/abstract-signer";

interface Props {
  encryptionKeyPair: KeyPair | undefined;
  waku: WakuPrivacy | undefined;
  address: string | undefined;
  signer: TypedDataSigner | undefined;
}

export default function BroadcastPublicKey({
  encryptionKeyPair,
  waku,
  address,
  signer,
}: Props) {
  const [publicKeyMsg, setPublicKeyMsg] = useState<PublicKeyMessage>();

  const broadcastPublicKey = async () => {
    if (!encryptionKeyPair) return;
    if (!address) return;
    if (!waku) return;
    if (!signer) return;

    const _publicKeyMessage = await (async () => {
      if (!publicKeyMsg) {
        const pkm = await createPublicKeyMessage(
          address,
          encryptionKeyPair.publicKey,
          signer
        );

        setPublicKeyMsg(pkm);
        return pkm;
      }
      return publicKeyMsg;
    })();
    const payload = _publicKeyMessage.encode();

    const publicKeyMessageEncoder = new SymEncoder(
      PublicKeyContentTopic,
      PublicKeyMessageEncryptionKey
    );

    await waku.relay.send(publicKeyMessageEncoder, { payload });
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={broadcastPublicKey}
      disabled={!encryptionKeyPair || !waku || !address || !signer}
    >
      Broadcast Encryption Public Key
    </Button>
  );
}
