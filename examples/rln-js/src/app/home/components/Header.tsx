import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { Button } from "@/components/Button";
import { Status } from "@/components/Status";
import { useStore, useWallet } from "@/hooks";

export const Header: React.FunctionComponent<{}> = () => {
  const { appStatus } = useStore();
  const { onConnectWallet } = useWallet();

  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku RLN</Title>
        <Button onClick={onConnectWallet}>Connect Wallet</Button>
      </Block>
      <Status text="Application status" mark={appStatus} />
    </>
  );
};
