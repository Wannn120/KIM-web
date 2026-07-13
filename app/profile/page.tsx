import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import ProfilePage from "@/components/profile-page";
import { prisma } from "@/lib/prisma";

export default async function ProfileRoute() {
  const request = {
    headers: new Headers({
      cookie: cookies().toString(),
    }),
    cookies: cookies(),
  } as Parameters<typeof requireAuth>[0];

  const auth = requireAuth(request);
  if (!auth.ok) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.sub },
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
