"use client";

import { BadgeCheck, RefreshCw, Sparkles } from "lucide-react";
import { useAccountCategory } from "../../context/AccountCategoryContext";
import { formatWeekReset, hasAccountPermission, quotaDescription } from "../../accountCategories";

export default function AccountCategoryStatus({
  compact = false,
  onCreate,
}: {
  compact?: boolean;
  onCreate?: () => void;
}) {
  const { account, loading, error, refresh } = useAccountCategory();
  if (!account)
    return (
      <section
        className="account-status is-loading"
        aria-label="Categoría de la cuenta"
        aria-busy={loading}
      >
        <p role={error ? "alert" : "status"}>
          {error || "Consultando tu categoría y cupo semanal…"}
        </p>
        {error && (
          <button type="button" className="secondary-button" onClick={() => void refresh()}>
            <RefreshCw size={15} /> Volver a consultar
          </button>
        )}
      </section>
    );
  const exhausted = account.publicacionesRestantes === 0;
  const limit = account.categoria.publicacionesSemanales;
  return (
    <section
      className={
        "account-status" + (compact ? " is-compact" : "") + (exhausted ? " is-exhausted" : "")
      }
      aria-label="Categoría y cupo semanal"
      data-category={account.categoria.codigo}
    >
      <header>
        <span className="account-category-badge">
          <BadgeCheck size={17} aria-hidden="true" />
          {account.categoria.nombre}
        </span>
        <strong>{quotaDescription(account)}</strong>
      </header>
      {limit !== null && (
        <progress
          value={Math.min(account.publicacionesConsumidas, limit)}
          max={limit}
          aria-label={
            String(account.publicacionesConsumidas) +
            " recuerdos propios publicados de " +
            limit +
            " semanales"
          }
        />
      )}
      <small>
        {limit === null ? (
          "Tu categoría no tiene límite semanal de recuerdos propios."
        ) : (
          <>
            Tu cupo se renueva el {formatWeekReset(account.reinicioSemana)} a las 00:00 (Argentina).
          </>
        )}
      </small>
      {account.categoria.permitePrimerRecuerdo && (
        <p className="account-first-memory">
          Tu primer recuerdo te convierte en Nostálgico y cuenta dentro del cupo semanal.
          {onCreate && !exhausted && (
            <button type="button" className="secondary-button" onClick={onCreate}>
              Publicar mi primer recuerdo
            </button>
          )}
        </p>
      )}
      {exhausted && (
        <p role="status">
          Ya usaste tus publicaciones de esta semana. Podés seguir disfrutando de los recuerdos de
          la comunidad.
        </p>
      )}
      {!compact && (
        <details>
          <summary>
            <Sparkles size={15} aria-hidden="true" /> Los beneficios de tu categoría
          </summary>
          <ul>
            <li>
              {limit === null
                ? "Recuerdos propios ilimitados."
                : String(limit) + " recuerdos propios por semana, de domingo a sábado."}
            </li>
            <li>
              {account.maximoAdjuntos === 1
                ? "Un adjunto por recuerdo, siempre opcional."
                : "Hasta " +
                  account.maximoAdjuntos +
                  " adjuntos por recuerdo: fotos y videos combinados."}
            </li>
            <li>
              {hasAccountPermission(account, "Comentar")
                ? "Comentarios, puntuaciones, etiquetas y reposts habilitados."
                : "Likes, guardados, seguir perfiles y ser etiquetado. Publicá tu primer recuerdo para habilitar más acciones."}
            </li>
            <li>
              {hasAccountPermission(account, "AgregarMusicaAPublicacion")
                ? "Música de Spotify en tus publicaciones."
                : "La música en publicaciones se habilita desde Aedo."}
            </li>
            {hasAccountPermission(account, "SugerirMusica") && (
              <li>Sugerencias musicales de la época que estás recorriendo.</li>
            )}
            {account.categoria.prioridadVisibilidad !== "Normal" && (
              <li>
                Prioridad{" "}
                {account.categoria.prioridadVisibilidad === "MuyAlta" ? "muy alta" : "alta"} en las
                recomendaciones de “Para vos”.
              </li>
            )}
          </ul>
          {account.categoria.codigo === "Nostalgico" && (
            <p>
              Para llegar a Aedo, uno de tus recuerdos tiene que recibir 30 puntos de nostalgia.
            </p>
          )}
          <small>
            Los reposts y las etiquetas no consumen cupo. Borrar un recuerdo no devuelve su lugar de
            esa semana.
          </small>
        </details>
      )}
      {error && (
        <p className="account-status-warning" role="status">
          No pudimos actualizar la última consulta.
          <button type="button" className="secondary-button" onClick={() => void refresh()}>
            Reintentar
          </button>
        </p>
      )}
    </section>
  );
}
