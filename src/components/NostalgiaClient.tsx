"use client";

import dynamic from "next/dynamic";

const ExploreView = dynamic(() => import("./map/ExploreView"), {
  ssr: false,
  loading: () => <p role="status">Cargando mapa…</p>,
});

export default function NostalgiaClient() {
  return <ExploreView />;
}
