import { Block, BlockTypes } from "@/components/Block";
import { Button } from "@/components/Button";
import { Subtitle } from "@/components/Subtitle";
import { useContract, useStore } from "@/hooks";

export const BlockchainInfo: React.FunctionComponent<{}> = () => {
  const { ethAccount, lastMembershipID } = useStore();
  const { onFetchContract } = useContract();

  return (
    <Block className="mt-10">
      <Block className="mb-3" type={BlockTypes.FlexHorizontal}>
        <Subtitle>Contract</Subtitle>
        <Button onClick={onFetchContract}>Fetch state</Button>
      </Block>

      <Block type={BlockTypes.FlexHorizontal}>
        <p>Your address</p>
        <code>{ethAccount || "Not loaded yet"}</code>
      </Block>

      <Block type={BlockTypes.FlexHorizontal}>
        <p>Latest membership ID on contract</p>
        <code>{lastMembershipID || "Not loaded yet"}</code>
      </Block>
    </Block>
  );
};
