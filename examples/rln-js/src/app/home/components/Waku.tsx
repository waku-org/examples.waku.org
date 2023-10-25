import { Block, BlockTypes } from "@/components/Block";
import { Subtitle } from "@/components/Subtitle";
import { Status } from "@/components/Status";
import { Button } from "@/components/Button";
import { useStore } from "@/store";

export const Waku: React.FunctionComponent<{}> = () => {
  const { wakuStatus } = useStore();

  return (
    <Block top="10">
      <Subtitle>Waku</Subtitle>
      <Status text="Waku status" mark={wakuStatus} />

      <Block top="4">
        <label
          htmlFor="remote-multiaddr"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Password(used for reading/saving into Keystore)
        </label>
        <Block type={BlockTypes.FlexHorizontal}>
          <input
            type="text"
            id="remote-multiaddr"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            defaultValue="/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/443/wss/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm"
          />
          <Button left="2">Dial</Button>
        </Block>
      </Block>

      <Block top="4">
        <label
          htmlFor="nick-input"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Your nickname
        </label>
        <input
          type="text"
          id="nick-input"
          className="w-full mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Choose a nickname"
        />
      </Block>

      <Block top="4">
        <Block>
          <label
            htmlFor="message-input"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Message
          </label>
          <input
            type="text"
            id="message-input"
            className="w-full mr-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Text your message here"
          />
        </Block>
        <Button top="2">Send</Button>
      </Block>

      <Block top="4">
        <p className="text-l mb-4">Messages</p>
      </Block>
    </Block>
  );
};
