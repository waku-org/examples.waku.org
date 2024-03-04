"use client";
import { usePathname, useSearchParams } from "next/navigation";

export const useNoteURL = (): { id: string; key: string } => {
  const pathname = usePathname();
  const params = useSearchParams();

  const segments = pathname.split("/");
  const viewIndex = segments.indexOf("view");
  const key = params.get("key");

  const id = segments[viewIndex + 1];

  return { key, id };
};
