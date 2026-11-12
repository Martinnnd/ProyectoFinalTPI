import type { Metadata } from "next";
import { ResetPasswordForm } from "../../../components/auth/PasswordRecoveryForm";

export const metadata: Metadata = {
  title: "Nueva contraseña | Nostalgiar",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
