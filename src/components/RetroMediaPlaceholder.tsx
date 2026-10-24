"use client";

import React from "react";
import { CassetteTape } from "lucide-react";

export interface RetroMediaPlaceholderProps {
  year?: number;
  title?: string;
  category?: string;
  failed?: boolean;
  compact?: boolean;
  className?: string;
}

export default function RetroMediaPlaceholder({
  year,
  title,
  category,
  failed = false,
  compact = false,
  className = "",
}: RetroMediaPlaceholderProps) {
  return (
    <div
      className={`retro-media-placeholder${failed ? " is-failed" : ""}${compact ? " is-compact" : ""} ${className}`.trim()}
      role="img"
      aria-label={failed ? "Archivo multimedia no disponible" : "Recuerdo sin fotografía adjunta"}
    >
      <div className="retro-media-vignette" />
      <div className="retro-media-content">
        <div className="retro-media-cassette-art">
          <CassetteTape size={compact ? 28 : 42} strokeWidth={1.6} className="retro-tape-icon" />
          <div className="retro-tape-spools" aria-hidden="true">
            <span className="retro-spool" />
            <span className="retro-spool" />
          </div>
        </div>

        <div className="retro-media-text">
          <span className="retro-media-status">
            <span className="retro-rec-dot" />
            {failed ? "SEÑAL PERDIDA · ARCHIVO NO DISPONIBLE" : "ARCHIVO SONORO · SIN FOTO ADJUNTA"}
          </span>

          {!compact && (
            <p className="retro-media-caption">
              {failed
                ? "La cinta o fotografía original no se pudo sincronizar."
                : title
                ? `«${title}»`
                : "Recuerdo testimonial registrado en el archivo de Nostalgiar"}
            </p>
          )}

          <div className="retro-media-badge-row">
            {year && <span className="retro-media-pill">{year}</span>}
            {category && <span className="retro-media-pill">{category}</span>}
            <span className="retro-media-pill">NOSTALGIAR STEREO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
