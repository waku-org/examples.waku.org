"use client";

import React from "react";
import Markdown from "react-markdown";
import { useRouter } from "next/navigation";
import { useNoteURL } from "@/hooks/useNoteURL";
import { notes } from "@/services/notes";
import { Loading } from "../Loading";

const View = () => {
  const router = useRouter();
  const { id, password } = useNoteURL();
  const [note, setNote] = React.useState<string>("");

  React.useEffect(() => {
    if (!id) {
      router.replace("/404");
      return;
    }

    notes.readNote(id, password).then((note) => setNote(note || ""));
  }, [id, password, setNote]);

  if (!note) {
    return <Loading />;
  }

  return <Markdown>{note}</Markdown>;
};

export default View;
