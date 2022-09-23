import React, { useEffect, useState } from "react";
import "./App.css";
import * as rln from "@waku/rln";
import type { RLNInstance, MembershipKey } from "@waku/rln/dist/rln.js";
import { utils } from "js-waku";
import Button from "@mui/material/Button";

function App() {
  const [rlnInstance, setRlnInstance] = useState<RLNInstance>();
  const [membershipKey, setMembershipKey] = useState<MembershipKey>();
  const [rlnKey, setRlnKey] = useState<string>();
  const [rlnCommitment, setRlnCommitment] = useState<string>();

  useEffect(() => {
    if (rlnInstance) return;

    (async () => {
      const instance = await rln.create();
      setRlnInstance(instance);
    })();
  });

  useEffect(() => {
    if (!membershipKey) return;

    const _rlnKey = utils.bytesToHex(membershipKey.IDKey);
    const _rlnCommitment = utils.bytesToHex(membershipKey.IDCommitment);

    setRlnKey(_rlnKey);
    setRlnCommitment(_rlnCommitment);
  }, [membershipKey]);

  return (
    <div className="App">
      <h2>RLN Credentials:</h2>
      <p>key: {rlnKey}</p>
      <p>commitment: {rlnCommitment}</p>
      <Generate rlnInstance={rlnInstance} setMembershipKey={setMembershipKey} />
    </div>
  );
}

export default App;

interface GenerateProps {
  rlnInstance?: RLNInstance;
  setMembershipKey: (k: MembershipKey) => void;
}

function Generate(props: GenerateProps) {
  const { rlnInstance, setMembershipKey } = props;

  const onClick = async () => {
    if (!rlnInstance) return;
    const membershipKey = rlnInstance.generateMembershipKey();
    setMembershipKey(membershipKey);
  };

  return (
    <div>
      <Button variant="contained" onClick={onClick} disabled={!rlnInstance}>
        Generate RLN Credentials
      </Button>
    </div>
  );
}
