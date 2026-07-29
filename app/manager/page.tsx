import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import { getAdminSummary } from "@/lib/admin-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/manager/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["manager"])) {
    redirect(getAdminPanelPath(admin.role));
  }

  const summary = await getAdminSummary();
  return <AdminDashboard admin={admin} summary={summary} />;
}
