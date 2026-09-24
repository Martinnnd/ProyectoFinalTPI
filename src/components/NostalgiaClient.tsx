"use client";
import dynamic from "next/dynamic";
// Leaflet and the existing interactive experience require browser APIs.
const App = dynamic(() => import("../App"), {
  ssr: false,
  loading: () => <p role="status">Cargando Nostalgia…</p>,
});
export default function NostalgiaClient() {
  return <App />;
}
