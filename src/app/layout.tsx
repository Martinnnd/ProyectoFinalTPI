import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import "../themes.css";
import "../social.css";
import "../components/mapbox.css";
import "../eras/70s/theme.css";
//import "../eras/80s/theme.css";
import "../eras/90s/theme.css";
//import "../eras/2000s/theme.css";
export const metadata: Metadata = {
  title: "Nostalgia",
  description: "Historias, lugares y musica de nuestras epocas",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
