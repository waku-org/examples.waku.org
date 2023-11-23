"use client";

import React from "react";
import Markdown from "react-markdown";
import { useRouter } from "next/navigation";
import { useNoteHash } from "@/hooks/useNoteHash";
import { notes } from "@/services/notes";
import { Loading } from "../Loading";

const View = () => {
  const router = useRouter();
  const noteHash = useNoteHash();
  const [note, setNote] = React.useState<string>("");

  React.useEffect(() => {
    if (!noteHash) {
      router.replace("/404");
      return;
    }

    notes.readNote(noteHash).then((note) => setNote(note || ""));
  }, [noteHash, setNote]);

  if (!note) {
    return <Loading />;
  }

  return <Markdown>{note}</Markdown>;
};

export default View;
