"use client";
import { usePathname, useSearchParams } from "next/navigation";

export const useNoteURL = (): undefined | string => {
  const pathname = usePathname();
  const params = useSearchParams();

  const segments = pathname.split("/");
  const viewIndex = segments.indexOf("view");
  const password = params.get("password");

  return {
    password,
    id: segments[viewIndex + 1] || undefined,
  };
};
