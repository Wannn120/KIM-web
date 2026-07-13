import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@/lib/security";
import ProfilePage from "@/components/profile-page";
import { prisma } from "@/lib/prisma";

export default async function ProfileRoute() {
  const requestCookies = await cookies();
  const token = requestCookies.get("auth-token")?.value;
  const payload = token ? verifyJwt(token) : null;

  if (!payload || typeof payload !== "object" || !("sub" in payload)) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return <ProfilePage />;
}
