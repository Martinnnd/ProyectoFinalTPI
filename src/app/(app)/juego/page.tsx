import type { Metadata } from "next";
import DecadeGame from "../../../components/game/DecadeGame";

export const metadata: Metadata = {
  title: "Juego de las décadas | Nostalgiar",
  description: "Adiviná la década de cada fotografía y poné a prueba tu memoria.",
};

export default function JuegoPage() {
  return <DecadeGame />;
}
