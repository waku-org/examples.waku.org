import { Block, BlockTypes } from "@/components/Block";

export const KeystoreDetails: React.FunctionComponent<{}> = () => {
  return (
    <Block className="mt-5">
      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Keystore</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Membership ID</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Secret Hash</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Commitment</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Nullifier</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Trapdoor</p>
        <code>none</code>
      </Block>
    </Block>
  );
};