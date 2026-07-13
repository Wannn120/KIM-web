import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
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

  return <LoginForm />;
}
