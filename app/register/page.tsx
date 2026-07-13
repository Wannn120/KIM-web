import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/security";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const token = cookies().get("auth-token")?.value;
  const payload = token ? verifyJwt(token) : null;

  if (payload && typeof payload === "object" && "sub" in payload) {
    redirect("/profile");
  }

  return <RegisterForm />;
}
