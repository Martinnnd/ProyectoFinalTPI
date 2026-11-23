import type { AuthSession } from "../components/auth/authTypes";
import type { Candidate, Round, SongInput, Vote } from "./api";

export function currentDecade(now = new Date()) {
  const year = Number(
    new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(now),
  );
  return Math.floor(year / 10) * 10;
}
export function validateSong(song: SongInput, now = new Date()): string | null {
  if (
    !Number.isInteger(song.decada) ||
    song.decada % 10 ||
    song.decada < 1900 ||
    song.decada > currentDecade(now)
  )
    return "Elegí una década entre 1900 y la década actual, en múltiplos de 10.";
  if (![song.titulo, song.artista].every((text) => text.trim().length > 0 && text.length <= 120))
    return "Título y artista son obligatorios y admiten hasta 120 caracteres cada uno.";
  return null;
}
export function canManage(candidate: Candidate, session: AuthSession | null) {
  return !!session && (session.esAdmin || candidate.creadorId === session.usuarioId);
}
export function isRoundActive(round: Round, now = Date.now()) {
  return Date.parse(round.apertura) <= now && now < Date.parse(round.cierre);
}
export function canEdit(candidate: Candidate, round: Round, session: AuthSession | null) {
  return canManage(candidate, session) && candidate.puntos === 0 && isRoundActive(round);
}
export function validContribution(points: number, round: Round, now = Date.now()) {
  return (
    isRoundActive(round, now) &&
    !!round.saldo &&
    Date.parse(round.saldo.reinicio) > now &&
    Number.isSafeInteger(points) &&
    points > 0 &&
    points <= round.saldo.puntosRestantes
  );
}
export function applyVote(round: Round, candidateId: number, vote: Vote): Round {
  return {
    ...round,
    saldo: round.saldo && { ...round.saldo, puntosRestantes: vote.puntosDiariosRestantes },
    decadas: round.decadas.map((decade) => ({
      ...decade,
      candidaturas: decade.candidaturas.map((song) =>
        song.id === candidateId ? { ...song, puntos: vote.puntosTotales } : song,
      ),
    })),
  };
}
export function nextRefresh(round: Round, now = Date.now()) {
  if (Date.parse(round.cierre) <= now || (round.saldo && Date.parse(round.saldo.reinicio) <= now))
    return 15_000;
  const dates = [
    Date.parse(round.cierre),
    ...(round.saldo ? [Date.parse(round.saldo.reinicio)] : []),
  ].filter((date) => date > now);
  // A short retry also covers the gap between the cutoff and the worker opening a round.
  return dates.length
    ? Math.min(2_147_000_000, Math.max(250, Math.min(...dates) - now + 100))
    : 15_000;
}
export function formatRankingDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

export function rankingCountdown(close: string, now: number) {
  const remaining = Date.parse(close) - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Finalizó";
  if (remaining > 86_400_000) {
    const days = Math.ceil(remaining / 86_400_000);
    return `${days} ${days === 1 ? "día" : "días"}`;
  }
  if (remaining > 3_600_000) return `${Math.ceil(remaining / 3_600_000)} h`;
  return `${Math.ceil(remaining / 60_000)} min`;
}
