"use client";

import { useWaku } from "@/app/WakuProvider";

export default function Create() {
  const { status } = useWaku();
  return (
    <div>
      <p>{status}</p>
    </div>
  );
}
