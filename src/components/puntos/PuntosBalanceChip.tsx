"use client";

import { useEffect, useState } from "react";
import { getSaldoPuntos, type SaldoPuntosDto } from "../../puntosNostalgiaApi";
import PuntosModal from "./PuntosModal";

export default function PuntosBalanceChip({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [saldo, setSaldo] = useState<SaldoPuntosDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarSaldo() {
      const data = await getSaldoPuntos();
      if (activo && data) {
        setSaldo(data);
      }
    }

    cargarSaldo();

    function onPuntosActualizados(e: Event) {
      const custom = e as CustomEvent<SaldoPuntosDto>;
      if (custom.detail) {
        setSaldo(custom.detail);
      } else {
        cargarSaldo();
      }
    }

    function onFocusOrVisible() {
      cargarSaldo();
    }

    window.addEventListener("nostalgiar:puntos-actualizados", onPuntosActualizados);
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);

    return () => {
      activo = false;
      window.removeEventListener("nostalgiar:puntos-actualizados", onPuntosActualizados);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, []);

  if (!saldo) return null;

  return (
    <>
      <button
        type="button"
        className={`puntos-chip ${compact ? "is-compact" : ""}`}
        onClick={() => setModalOpen(true)}
        title="Ver saldo y recargar puntos de nostalgia"
        aria-label={`Saldo de puntos de nostalgia: ${saldo.totalDisponible} puntos disponibles`}
      >
        <span className="puntos-chip-icon">
          <img src="/nostalgiar-rail-logo.png" alt="" />
        </span>
        <span className="puntos-chip-text">
          <strong className="puntos-chip-amount">{saldo.totalDisponible}</strong>
          <span className="puntos-chip-label">pts</span>
        </span>
        <span className="puntos-chip-plus" aria-hidden="true">+</span>
      </button>

      <PuntosModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          void getSaldoPuntos().then((data) => {
            if (data) setSaldo(data);
          });
        }}
        saldo={saldo}
        onSaldoUpdated={(nuevo) => setSaldo(nuevo)}
      />
    </>
  );
}
