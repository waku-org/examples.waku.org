"use client";

import { useWaku } from "@/app/WakuProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const { status } = useWaku();
  const router = useRouter();
  return (
    <div>
      <p>{status}</p>
      <button
        onClick={() => {
          router.push("/create");
        }}
      >
        Create new
      </button>
      <button>Edit existing</button>
    </div>
  );
}
