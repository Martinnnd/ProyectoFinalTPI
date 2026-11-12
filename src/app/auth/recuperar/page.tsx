import type { Metadata } from "next";
import { RequestPasswordRecoveryForm } from "../../../components/auth/PasswordRecoveryForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Nostalgiar",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RecoverPasswordPage() {
  return <RequestPasswordRecoveryForm />;
}
