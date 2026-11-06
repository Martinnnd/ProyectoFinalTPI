import type { ReactNode } from "react";
import styles from "../../components/auth/auth.module.css";
import ToastViewport from "../../components/layout/ToastViewport";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      {children}
      <ToastViewport />
    </main>
  );
}
