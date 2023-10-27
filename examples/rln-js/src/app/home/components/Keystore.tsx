import React from "react";
import { Block, BlockTypes } from "@/components/Block";
import { Button } from "@/components/Button";
import { Status } from "@/components/Status";
import { Subtitle } from "@/components/Subtitle";
import { useStore, useWallet } from "@/hooks";

export const Keystore: React.FunctionComponent<{}> = () => {
  const { keystoreStatus, keystoreCredentials } = useStore();
  const { onGenerateCredentials } = useWallet();

  const credentialsNodes = React.useMemo(
    () =>
      keystoreCredentials.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      )),
    [keystoreCredentials]
  );

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
        <p className="text-s mb-2">Generate new credentials from wallet</p>
        <Button onClick={onGenerateCredentials}>
          Generate new credentials
        </Button>
        <Button className="ml-5">Register credentials</Button>
      </Block>

      <Block className="mt-4">
        <p className="text-s">Read from Keystore</p>
        <Block type={BlockTypes.FlexHorizontal}>
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-3/4 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            {credentialsNodes}
          </select>
          <Button>Read credentials</Button>
        </Block>
      </Block>
    </Block>
  );
};
