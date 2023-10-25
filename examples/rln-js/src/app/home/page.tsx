"use client";
import { Header } from "./components/Header";
import { Waku } from "./components/Waku";
import { Keystore } from "./components/Keystore";
import { Blockchain } from "./components/Blockchain";
import { KeystoreDetails } from "./components/KeystoreDetails";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-24 font-mono">
      <Header />
      <Blockchain />
      <Keystore />
      <KeystoreDetails />
      <Waku />
    </main>
  );
}
