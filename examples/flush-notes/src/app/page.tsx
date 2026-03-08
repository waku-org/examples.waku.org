"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { notes } from "@/services/notes";

export default function Create() {
  const router = useRouter();
  const { note, onNoteChange } = useEditNote();

  const onSave = async () => {
    if (!note) {
      return;
    }

    try {
      const { id, key } = await notes.createNote(note);
      const passwordParam = `?key=${key}`;

      router.push(`/view/${id}${passwordParam}`);
    } catch (error) {
      console.error("Failed to create a note:", error);
    }
  };

  return (
    <div>
      <p className="note-info">
        Your record will be stored for couple of days. Markdown is supported.
      </p>
      <div className="create-header">
        <div></div>
        <button onClick={onSave} className="save-note">
          Save note
        </button>
      </div>
      <textarea
        className="note-value"
        value={note}
        onChange={onNoteChange}
      ></textarea>
    </div>
  );
}

const useEditNote = () => {
  const [state, setState] = React.useState<string>("");

  const onNoteChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setState(event?.currentTarget?.value);
  };

  return {
    note: state,
    onNoteChange,
  };
};
