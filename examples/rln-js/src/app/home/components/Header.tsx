import { Block, BlockTypes } from "@/components/Block";
import { Title } from "@/components/Title";
import { Status } from "@/components/Status";
import { useStore } from "@/hooks";

export const Header: React.FunctionComponent<{}> = () => {
  const { appStatus } = useStore();

  return (
    <>
      <Block className="mb-5" type={BlockTypes.FlexHorizontal}>
        <Title>Waku RLN</Title>
      </Block>
      <Status text="Application status" mark={appStatus} />
    </>
  );
};
