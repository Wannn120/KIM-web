import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import { getAdminSummary, getDefaultAdminSummary } from "@/lib/admin-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/superadmin/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["super_admin"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  const summary = await getAdminSummary().catch((error) => {
    console.error("[SUPERADMIN] Unable to load dashboard summary:", error);
    return getDefaultAdminSummary();
  });

  return <AdminDashboard admin={admin} summary={summary} />;
}
