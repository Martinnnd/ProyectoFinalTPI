import type { Metadata } from "next";
import ToastViewport from "../../components/layout/ToastViewport";

export const metadata: Metadata = {
  title: "Administración | Nostalgiar",
  description: "Panel de administración de Nostalgiar",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
