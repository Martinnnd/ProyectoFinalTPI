"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { useEraState } from "../../context/EraContext";
import {
  getPacksPuntos,
  iniciarCompraPack,
  type PackPuntosDto,
  type PreferenciaCompraDto,
  type SaldoPuntosDto,
} from "../../puntosNostalgiaApi";

interface PuntosModalProps {
  isOpen: boolean;
  onClose: () => void;
  saldo: SaldoPuntosDto | null;
  onSaldoUpdated: (nuevo: SaldoPuntosDto) => void;
}

export default function PuntosModal({
  isOpen,
  onClose,
  saldo,
  onSaldoUpdated,
}: PuntosModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const period = useEraState((state) => state.period);
  const [packs, setPacks] = useState<PackPuntosDto[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [comprandoPackId, setComprandoPackId] = useState<string | null>(null);
  const [preferencia, setPreferencia] = useState<PreferenciaCompraDto | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        cargarPacks();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setPreferencia(null);
      setExito(null);
      setError(null);
    }
  }, [isOpen]);

  async function cargarPacks() {
    setLoadingPacks(true);
    try {
      const data = await getPacksPuntos();
      setPacks(data);
    } catch {
      setError("No se pudieron cargar los packs de puntos.");
    } finally {
      setLoadingPacks(false);
    }
  }

  async function handleComprar(packId: string) {
    setError(null);
    setExito(null);
    setComprandoPackId(packId);
    try {
      const pref = await iniciarCompraPack(packId);
      setPreferencia(pref);
    } catch (err: any) {
      setError(err?.message || "Error al procesar la compra.");
    } finally {
      setComprandoPackId(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`puntos-dialog era-${period?.decade ?? 1980}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="puntos-dialog-title"
    >
      <header className="puntos-dialog-header">
        <div className="puntos-dialog-header-title">
          <img
            src="/nostalgiar-rail-logo.png"
            alt=""
            className="puntos-dialog-header-logo"
            width={26}
            height={26}
          />
          <h2 id="puntos-dialog-title">Puntos de Nostalgia</h2>
        </div>
        <button
          type="button"
          className="icon-button puntos-dialog-close"
          onClick={onClose}
          aria-label="Cerrar ventana de puntos"
        >
          <X size={20} />
        </button>
      </header>

      <div className="puntos-dialog-content">
        {/* Desglose de saldo actual */}
        {saldo && (
          <div className="puntos-balance-grid">
            <div className="puntos-balance-card total">
              <div>
                <div className="puntos-balance-card-label">Saldo Total Disponible</div>
                <div className="puntos-balance-card-val">{saldo.totalDisponible} pts</div>
                <div className="puntos-balance-card-sub">
                  Para calificar publicaciones y votar en el Ranking de Música
                </div>
              </div>
              <Sparkles size={32} className="puntos-sparkle-icon" />
            </div>

            <div className="puntos-balance-card">
              <div className="puntos-balance-card-label">Cupo Diario Gratuito</div>
              <div className="puntos-balance-card-val">
                {saldo.puntosRestantes} / {saldo.cupo}
              </div>
              <div className="puntos-balance-card-sub">Se renueva a medianoche</div>
            </div>

            <div className="puntos-balance-card">
              <div className="puntos-balance-card-label">Puntos Extra Comprados</div>
              <div className="puntos-balance-card-val">{saldo.puntosExtra} pts</div>
              <div className="puntos-balance-card-sub">No vencen nunca</div>
            </div>
          </div>
        )}

        {/* Alerta de éxito si recién acreditó */}
        {exito && (
          <div className="puntos-success-alert" role="status">
            <CheckCircle2 size={18} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
            {exito}
          </div>
        )}

        {/* Alerta de error */}
        {error && (
          <div className="account-status-warning" style={{ margin: "12px 0" }} role="alert">
            {error}
          </div>
        )}

        {/* Paso de Checkout activo */}
        {preferencia && (
          <div className="puntos-checkout-box">
            <h3 className="puntos-checkout-title">
              Confirmar compra de {preferencia.packNombre}
            </h3>
            <p className="puntos-checkout-subtitle">
              Recibirás <strong>+{preferencia.puntos} puntos extra</strong> de inmediato.
            </p>
            <div className="puntos-checkout-price">
              ${preferencia.precioArs.toLocaleString("es-AR")} ARS{" "}
              <span className="puntos-checkout-price-usd">
                (USD {preferencia.precioUsd})
              </span>
            </div>

            <div className="puntos-checkout-actions">
              <a
                href={preferencia.initPoint}
                className="puntos-mp-btn"
              >
                Pagar con Mercado Pago 💳 ↗
              </a>

              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: 4 }}
                onClick={() => setPreferencia(null)}
              >
                Elegir otro pack
              </button>
            </div>
          </div>
        )}

        {/* Catálogo de packs disponibles */}
        {!preferencia && (
          <>
            <div className="puntos-packs-heading">
              <span>Comprar paquetes de puntos extra</span>
              <small className="puntos-packs-subheading">
                Cotización dinámica · Mercado Pago
              </small>
            </div>

            {loadingPacks ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} />
                <p className="puntos-packs-loading-text">
                  Consultando cotización y packs...
                </p>
              </div>
            ) : (
              <div className="puntos-packs-grid">
                {packs.map((pack) => (
                  <div
                    key={pack.id}
                    className={`puntos-pack-card ${pack.destacado ? "destacado" : ""}`}
                  >
                    {pack.etiqueta && (
                      <span className="puntos-pack-badge">{pack.etiqueta}</span>
                    )}

                    <div className="puntos-pack-icon">
                      <img src="/nostalgiar-rail-logo.png" alt="" />
                    </div>

                    <div className="puntos-pack-title">{pack.nombre}</div>
                    <div className="puntos-pack-points">+{pack.puntos} pts</div>

                    <div className="puntos-pack-pricing">
                      <div className="puntos-pack-price-usd">USD {pack.precioUsd}</div>
                      <div className="puntos-pack-price-ars">
                        ~ ${pack.precioArs.toLocaleString("es-AR")} ARS
                      </div>
                    </div>

                    <button
                      type="button"
                      className="puntos-buy-button"
                      disabled={comprandoPackId === pack.id}
                      onClick={() => handleComprar(pack.id)}
                    >
                      {comprandoPackId === pack.id ? "Procesando..." : "Comprar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
