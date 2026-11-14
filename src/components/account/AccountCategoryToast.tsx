"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleAlert, LockKeyhole, Sparkles, X } from "lucide-react";
import { useAccountCategory } from "../../context/AccountCategoryContext";
import { useEra } from "../../context/EraContext";
import { useAuth } from "../auth/AuthProvider";

const labels = {
  1970: "Novedades del archivo",
  1980: "VIDEO CLUB / ESTADO DE CUENTA",
  1990: "Nostalgiar — Información de cuenta",
  2000: "Nostalgiar Messenger · Tu cuenta",
  2010: "Tu cuenta, tus recuerdos",
  2020: "Tu recorrido en Nostalgiar",
};

export default function AccountCategoryToast() {
  const { notice, dismissNotice } = useAccountCategory();
  const { period } = useEra();
  const { isAuthenticated } = useAuth();
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!notice || paused) return;
    const timer = window.setTimeout(dismissNotice, 12_000);
    return () => window.clearTimeout(timer);
  }, [notice?.id, paused, dismissNotice]);
  if (!notice) return null;
  const Icon =
    notice.kind === "promotion"
      ? Sparkles
      : notice.kind === "permission"
        ? LockKeyhole
        : CircleAlert;
  return (
    <aside
      className={"account-notice is-" + notice.kind}
      data-era={period.decade}
      aria-label={notice.kind === "promotion" ? "Ascenso de categoría" : "Aviso de tu cuenta"}
      role={notice.kind === "error" || notice.kind === "limit" ? "alert" : "status"}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!(
          event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)
        ))
          setPaused(false);
      }}
    >
      <header className="account-notice-titlebar">
        <span>{labels[period.decade]}</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar aviso de categoría"
          onClick={dismissNotice}
        >
          <X size={17} />
        </button>
      </header>
      <div className="account-notice-content">
        <span className="account-notice-icon">
          <Icon size={25} aria-hidden="true" />
        </span>
        <div>
          <strong>{notice.title}</strong>
          <p>{notice.description}</p>
          <Link
            href={isAuthenticated ? "/perfil?categoria=cuenta" : "/auth/login?returnTo=/explorar"}
            onClick={dismissNotice}
          >
            {isAuthenticated ? "Ver mi categoría y mi cupo" : "Iniciar sesión"}
          </Link>
        </div>
      </div>
    </aside>
  );
}
