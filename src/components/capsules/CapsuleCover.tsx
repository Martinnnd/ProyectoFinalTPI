"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getCapsuleCover, type Capsule } from "../../capsulesApi";
import { useAuth } from "../auth/AuthProvider";

// La imagen privada se pide con la misma sesión que el resto de la API.
// No ponemos el token ni una dirección firmada de Cloudinary en el HTML.
export default function CapsuleCover({
  capsule,
  className,
  fallback,
  decorative = false,
}: {
  capsule: Capsule;
  className?: string;
  fallback: ReactNode;
  decorative?: boolean;
}) {
  const { session, status } = useAuth();
  if (!capsule.portadaUrl || status === "loading") return fallback;
  return (
    <CoverImage
      key={`${session?.usuarioId ?? "guest"}:${capsule.id}:${capsule.fechaActualizacion}:${capsule.portadaUrl}`}
      capsule={capsule}
      className={className}
      fallback={fallback}
      decorative={decorative}
    />
  );
}

function CoverImage({
  capsule,
  className,
  fallback,
  decorative,
}: {
  capsule: Capsule;
  className?: string;
  fallback: ReactNode;
  decorative: boolean;
}) {
  const [source, setSource] = useState(capsule.portadaSubida ? "" : (capsule.portadaUrl ?? ""));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!capsule.portadaSubida) return;
    const controller = new AbortController();
    let url: string | undefined;
    getCapsuleCover(capsule.id, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setSource(url);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [capsule.id, capsule.portadaSubida]);
  if (!source || failed) return fallback;
  return (
    <img
      className={className}
      src={source}
      alt={decorative ? "" : `Portada de ${capsule.nombre}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
