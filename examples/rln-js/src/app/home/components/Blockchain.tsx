import { Block, BlockTypes } from "@/components/Block";
import { Button } from "@/components/Button";
import { Subtitle } from "@/components/Subtitle";

export const Blockchain: React.FunctionComponent<{}> = () => {
  return (
    <Block className="mt-10">
      <Block className="mb-3" type={BlockTypes.FlexHorizontal}>
        <Subtitle>Contract</Subtitle>
        <Button>Fetch state</Button>
      </Block>

      <Block type={BlockTypes.FlexHorizontal}>
        <p>Your address</p>
        <code>Not loaded yet</code>
      </Block>

      <Block type={BlockTypes.FlexHorizontal}>
        <p>Latest membership ID on contract</p>
        <code>Not loaded yet</code>
      </Block>
    </Block>
  );
};
