"use client";
import { Header } from "./components/Header";
import { Waku } from "./components/Waku";
import { Keystore } from "./components/Keystore";
import { BlockchainInfo } from "./components/BlockchainInfo";
import { KeystoreDetails } from "./components/KeystoreDetails";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-24 font-mono max-w-screen-lg m-auto">
      <Header />
      <BlockchainInfo />
      <Keystore />
      <KeystoreDetails />
      <Waku />
    </main>
  );
}
