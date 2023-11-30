"use client";

import React from "react";
import { Inter } from "next/font/google";
import { WakuProvider } from "@/components/WakuProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <title>Share notes</title>
      <body className={inter.className}>
        <WakuProvider>{children}</WakuProvider>
      </body>
    </html>
  );
}
