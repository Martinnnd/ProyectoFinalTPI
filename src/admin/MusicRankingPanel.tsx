"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { addAdminSong } from "../musicRanking/api";
import SongForm from "../musicRanking/SongForm";
import styles from "./admin.module.css";

export default function MusicRankingPanel() {
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  if (!session?.esAdmin) return <p role="alert">Se requiere una sesión de administrador.</p>;
  return (
    <section className={styles.panel}>
      <h2>Cargar una candidatura</h2>
      <p>
        La canción se agrega a la ronda vigente. Esta carga administrativa está disponible sin
        depender de la categoría.
      </p>
      <SongForm
        label="Cargar canción"
        onSave={async (song) => {
          setMessage("");
          const result = await addAdminSong(song);
          setMessage(`Se agregó «${result.titulo}» a la ronda vigente.`);
          return true;
        }}
      />
      {message && <p role="status">{message}</p>}
      <p>
        <Link href="/perfil#ranking-musical">Ver ranking, corregir o retirar candidaturas</Link>
      </p>
    </section>
  );
}
