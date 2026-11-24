import type { Metadata } from "next";
import AuthForm from "../../../components/auth/AuthForm";

export const metadata: Metadata = { title: "Iniciar sesión | Nostalgiar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = typeof params.returnTo === "string" ? params.returnTo : "/explorar";
  const origin = "https://nostalgiar.invalid";
  const target = URL.parse(requested, origin);
  const returnTo =
    requested.startsWith("/") && target?.origin === origin && !target.pathname.startsWith("//")
      ? target.pathname + target.search + target.hash
      : "/explorar";
  return <AuthForm mode="login" returnTo={returnTo} />;
}
