import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Nostalgiar",
  description: "Historias, lugares y música de nuestras épocas",
};
export const viewport: Viewport = { width:'device-width', initialScale:1, viewportFit:'cover', interactiveWidget:'resizes-content' };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
