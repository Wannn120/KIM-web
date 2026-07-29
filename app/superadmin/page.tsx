import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import { getAdminSummary } from "@/lib/admin-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/admin/login?role=super_admin");
  }

  if (!isAdminRoleAllowed(admin.role, ["super_admin"])) {
    redirect(getAdminPanelPath(admin.role));
  }

  const summary = await getAdminSummary();
  return <AdminDashboard admin={admin} summary={summary} />;
}
