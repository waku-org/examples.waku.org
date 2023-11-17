import { usePathname } from "next/navigation";

export const useNoteHash = (): undefined | string => {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const viewIndex = segments.indexOf("view");

  return segments[viewIndex + 1] || undefined;
};
