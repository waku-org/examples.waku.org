import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { Button } from "@/components/Button";
import { Status } from "@/components/Status";
import { useStore } from "@/store";

export const Header: React.FunctionComponent<{}> = () => {
  const { appStatus } = useStore();

  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku RLN</Title>
        <Button>Connect Wallet</Button>
      </Block>
      <Status text="Application status" mark={appStatus} />
    </>
  );
};
