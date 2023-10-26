"use client";
import { Header } from "./components/Header";
import { Waku } from "./components/Waku";
import { Keystore } from "./components/Keystore";
import { Blockchain } from "./components/Blockchain";
import { KeystoreDetails } from "./components/KeystoreDetails";
import { useRLN } from "@/hooks";

export default function Home() {
  const { rln } = useRLN();
  console.log(rln);

  return (
    <main className="flex min-h-screen flex-col p-24 font-mono max-w-screen-lg m-auto">
      <Header />
      <Blockchain />
      <Keystore />
      <KeystoreDetails />
      <Waku />
    </main>
  );
}
