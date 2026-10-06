import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nostalgiar",
  description: "Historias, lugares y música de nuestras épocas",
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
