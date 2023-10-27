import { Block, BlockTypes } from "@/components/Block";
import { useStore } from "@/hooks";
import { bytesToHex } from "@waku/utils/bytes";

export const KeystoreDetails: React.FunctionComponent<{}> = () => {
  const { credentials } = useStore();

  return (
    <Block className="mt-5">
      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Keystore hash</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Membership ID</p>
        <code>none</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Secret Hash</p>
        <code>{renderBytes(credentials?.IDSecretHash)}</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Commitment</p>
        <code>{renderBytes(credentials?.IDCommitment)}</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Nullifier</p>
        <code>{renderBytes(credentials?.IDNullifier)}</code>
      </Block>

      <Block className="mt-3" type={BlockTypes.FlexHorizontal}>
        <p>Trapdoor</p>
        <code>{renderBytes(credentials?.IDTrapdoor)}</code>
      </Block>
    </Block>
  );
};

function renderBytes(bytes: undefined | Uint8Array): string {
  return bytes ? bytesToHex(bytes) : "none";
}
