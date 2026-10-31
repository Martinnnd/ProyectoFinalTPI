import { useState, type FormEvent } from "react";
import type { Decade } from "../types";
import type { CreateGroupInput } from "../groupsApi";

type GroupCreateFormProps = {
  decade: Decade;
  onCreate: (group: CreateGroupInput) => Promise<string | null>;
  onCreated: () => void;
};

export default function GroupCreateForm({ decade, onCreate, onCreated }: GroupCreateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    const message = await onCreate({
      name: name.trim(),
      description: description.trim(),
      decade,
    });
    setSubmitting(false);

    if (message) {
      setError(message);
      return;
    }

    setName("");
    setDescription("");
    onCreated();
  }

  return (
    <form className="community-create-form" onSubmit={submit} aria-busy={submitting}>
      <label>
        <span>Nombre del grupo</span>
        <input
          required
          minLength={3}
          maxLength={100}
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
        />
      </label>
      <label>
        <span>Descripción</span>
        <textarea
          maxLength={500}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={submitting}
          placeholder="Contá de qué se trata el grupo"
        />
      </label>
      <small>
        Se creará para {decade}–{decade + 9}. Vas a quedar como creador e integrante.
      </small>
      <button type="submit" disabled={submitting}>
        {submitting ? "Creando…" : "Crear grupo"}
      </button>
      {error && (
        <p role="alert" className="community-form-error">
          {error}
        </p>
      )}
    </form>
  );
}
