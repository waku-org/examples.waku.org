"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { notes } from "@/services/notes";

export default function Create() {
  const router = useRouter();
  const { note, onNoteChange } = useEditNote();
  const { toEncrypt, onEncryptChange } = useEncryptedState();

  const onSave = async () => {
    if (!note) {
      return;
    }

    try {
      const { id, password } = await notes.createNote(note, toEncrypt);
      const passwordParam = password ? `?password=${password}` : "";

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
        <div>
          <input
            type="checkbox"
            id="isEncrypted"
            name="isEncrypted"
            onChange={onEncryptChange}
          />
          <label htmlFor="isEncrypted" className="to-encrypt">
            Private (only those that have link will read the note)
          </label>
        </div>
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

const useEncryptedState = () => {
  const [toEncrypt, setToEncrypt] = React.useState<string>();

  const onEncryptChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setToEncrypt(event?.currentTarget?.value);
  };

  return {
    toEncrypt,
    onEncryptChange,
  };
};
