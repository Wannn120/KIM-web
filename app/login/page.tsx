import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/security";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const requestCookies = await cookies();
  const token = requestCookies.get("auth-token")?.value;
  const payload = token ? verifyJwt(token) : null;

  if (payload && typeof payload === "object" && "sub" in payload) {
    redirect("/profile");
  }

  return <LoginForm />;
}
