import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const request = {
    headers: new Headers({
      cookie: cookies().toString(),
    }),
    cookies: cookies(),
  } as Parameters<typeof requireAuth>[0];

  const auth = requireAuth(request);
  if (auth.ok) {
    redirect("/profile");
  }

  return <RegisterForm />;
}
