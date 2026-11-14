import type { Metadata } from "next";
import DecadeGame from "../../../components/game/DecadeGame";
import { getLocalDecadePhotos } from "../../../components/game/localDecadePhotos.server";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Juego de las décadas | Nostalgiar",
  description: "Adiviná la década de cada fotografía y poné a prueba tu memoria.",
};

export default async function JuegoPage() {
  const localQuestions = await getLocalDecadePhotos();
  return <DecadeGame localQuestions={localQuestions} />;
}
