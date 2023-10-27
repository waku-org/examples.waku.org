import React from "react";
import { Block, BlockTypes } from "@/components/Block";
import { Button } from "@/components/Button";
import { Subtitle } from "@/components/Subtitle";
import { useStore, useWallet } from "@/hooks";
import { useKeystore } from "@/hooks/useKeystore";

export const Keystore: React.FunctionComponent<{}> = () => {
  const { keystoreCredentials } = useStore();
  const { onGenerateCredentials } = useWallet();
  const { onReadCredentials, onRegisterCredentials } = useKeystore();

  const { password, onPasswordChanged } = usePassword();
  const { selectedKeystore, onKeystoreChanged } = useSelectedKeystore();

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

      <Block className="mt-4">
        <label
          htmlFor="keystore-input"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Password(used for reading/saving into Keystore)
        </label>
        <input
          type="text"
          value={password}
          id="keystore-input"
          onChange={onPasswordChanged}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm w-full rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </Block>

      <Block className="mt-4">
        <p className="text-s mb-2">Generate new credentials from wallet</p>
        <Button onClick={onGenerateCredentials}>
          Generate new credentials
        </Button>
        <Button
          className="ml-5"
          onClick={() => onRegisterCredentials(password)}
        >
          Register credentials
        </Button>
      </Block>

      <Block className="mt-4">
        <p className="text-s">Read from Keystore</p>
        <Block type={BlockTypes.FlexHorizontal}>
          <select
            value={selectedKeystore}
            onChange={onKeystoreChanged}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-3/4 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            {credentialsNodes}
          </select>
          <Button onClick={() => onReadCredentials(selectedKeystore, password)}>
            Read credentials
          </Button>
        </Block>
      </Block>
    </Block>
  );
};

function usePassword() {
  const [password, setPassword] = React.useState<string>("");
  const onPasswordChanged = (event: React.FormEvent<HTMLInputElement>) => {
    setPassword(event.currentTarget.value);
  };

  return {
    password,
    onPasswordChanged,
  };
}

function useSelectedKeystore() {
  const [selectedKeystore, setKeystore] = React.useState<string>("");

  const onKeystoreChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    setKeystore(event.currentTarget.value || "");
  };

  return {
    selectedKeystore,
    onKeystoreChanged,
  };
}
