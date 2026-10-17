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
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/explorar";
  return <AuthForm mode="login" returnTo={returnTo} />;
}
