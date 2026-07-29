import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken } from "@/lib/admin-auth";
import SqlEditorClient from "./SqlEditorClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin || !admin.permissions.canManageAdmins) {
    redirect("/admin");
  }

  return <SqlEditorClient initialAdminName={admin.name ?? null} />;
}
