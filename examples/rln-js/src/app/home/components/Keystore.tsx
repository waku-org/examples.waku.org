import { Block, BlockTypes } from "@/components/Block";
import { Button } from "@/components/Button";
import { Status } from "@/components/Status";
import { Subtitle } from "@/components/Subtitle";
import { useStore } from "@/hooks";

export const Keystore: React.FunctionComponent<{}> = () => {
  const { keystoreStatus } = useStore();

  return (
    <Block className="mt-10">
      <Block type={BlockTypes.FlexHorizontal}>
        <Subtitle>Keystore</Subtitle>
        <div>
          <Button>Import</Button>
          <Button className="ml-2">Export</Button>
        </div>
      </Block>

      <Status text="Keystore status" mark={keystoreStatus} />

      <Block className="mt-4">
        <label
          htmlFor="keystore-input"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Password(used for reading/saving into Keystore)
        </label>
        <input
          type="text"
          id="keystore-input"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm w-full rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </Block>

      <Block className="mt-4">
        <p className="text-s">Generate new credentials from wallet</p>
        <Button>Generate new credentials</Button>
        <Button>Register credentials</Button>
      </Block>

      <Block className="mt-4">
        <p className="text-s">Read from Keystore</p>
        <select id="keystoreOptions"></select>
        <Button>Read credentials</Button>
      </Block>
    </Block>
  );
};
