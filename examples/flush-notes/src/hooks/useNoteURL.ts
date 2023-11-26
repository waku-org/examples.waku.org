"use client";
import { usePathname } from "next/navigation";

export const useNoteURL = (): undefined | string => {
  const pathname = usePathname();
  const urlParams = new URLSearchParams(window.location.search);
  const segments = pathname.split("/");
  const viewIndex = segments.indexOf("view");
  const password = urlParams.get("password");

  return {
    password,
    id: segments[viewIndex + 1] || undefined,
  };
};
