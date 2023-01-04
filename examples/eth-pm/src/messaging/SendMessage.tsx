import {
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";
import React, { ChangeEvent, useState, KeyboardEvent } from "react";
import type { RelayNode } from "@waku/interfaces";
import { createEncoder } from "@waku/message-encryption/ecies";
import { PrivateMessage } from "./wire";
import { PrivateMessageContentTopic } from "../waku";
import { hexToBytes } from "@waku/byte-utils";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));

export interface Props {
  waku: RelayNode | undefined;
  // address, public key
  recipients: Map<string, Uint8Array>;
}

export default function SendMessage({ waku, recipients }: Props) {
  const classes = useStyles();
  const [recipient, setRecipient] = useState<string>("");
  const [message, setMessage] = useState<string>();

  const handleRecipientChange = (
    event: ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    setRecipient(event.target.value as string);
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const items = Array.from(recipients.keys()).map((recipient) => {
    return (
      <MenuItem key={recipient} value={recipient}>
        {recipient}
      </MenuItem>
    );
  });

  const keyDownHandler = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.shiftKey
    ) {
      if (!waku) return;
      if (!recipient) return;
      if (!message) return;
      const publicKey = recipients.get(recipient);
      if (!publicKey) return;

      sendMessage(waku, recipient, publicKey, message, (res) => {
        if (res) {
          console.log("callback called with", res);
          setMessage("");
        }
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <FormControl className={classes.formControl}>
        <InputLabel id="select-recipient-label">Recipient</InputLabel>
        <Select
          labelId="select-recipient"
          id="select-recipient"
          value={recipient}
          onChange={handleRecipientChange}
        >
          {items}
        </Select>
      </FormControl>
      <TextField
        id="message-input"
        label="Message"
        variant="filled"
        onChange={handleMessageChange}
        onKeyDown={keyDownHandler}
        value={message}
      />
    </div>
  );
}

async function sendMessage(
  waku: RelayNode,
  recipientAddress: string,
  recipientPublicKey: Uint8Array,
  message: string,
  callback: (res: boolean) => void
) {
  const privateMessage = new PrivateMessage({
    toAddress: hexToBytes(recipientAddress),
    message: message,
  });
  const payload = privateMessage.encode();

  const encoder = createEncoder(PrivateMessageContentTopic, recipientPublicKey);

  console.log("pushing");
  const res = await waku.relay.send(encoder, { payload });
  console.log("Message sent", res);
  callback(Boolean(res.recipients.length));
}
