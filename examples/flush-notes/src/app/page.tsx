"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { notes } from "@/services/notes";

// EgeLwHNbSwIzIz3M
// 3gxFeAHa8sOvTymg

// encrypted nkt698RhpWory0yT
export default function Create() {
  const router = useRouter();
  const { note, onNoteChange } = useEditNote();
  const { password, onPasswordChange } = usePassword();

  const onSave = async () => {
    if (!note) {
      return;
    }

    try {
      const id = await notes.createNote(note, password);
      router.push(`/view/${id}`);
    } catch (error) {
      console.log("Failed to create a note:", error);
    }
  };

  return (
    <div>
      <p className="note-info">
        Your record will be stored for couple of days. Markdown is supported.
      </p>
      <div className="create-header">
        <input
          className="password-value"
          type="password"
          onChange={onPasswordChange}
          placeholder="Optional password"
          autoComplete="off"
        />
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

const usePassword = () => {
  const [password, setPassword] = React.useState<string>();

  const onPasswordChange = (event: React.FormEvent<HTMLInputElement>) => {
    setPassword(event?.currentTarget?.value);
  };

  return {
    password,
    onPasswordChange,
  };
};
