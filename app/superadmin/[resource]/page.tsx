import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPanelPath, getAuthenticatedAdminFromToken, isAdminRoleAllowed } from "@/lib/admin-auth";
import AdminResourceManager from "@/components/admin-resource-manager";

export const dynamic = "force-dynamic";
const resources = ["invoices", "reviews", "users", "settings", "audit-logs"] as const;
type Resource = (typeof resources)[number];

export default async function SuperadminResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!resources.includes(resource as Resource)) redirect("/superadmin");
  const admin = await getAuthenticatedAdminFromToken((await cookies()).get("admin-session")?.value ?? "");
  if (!admin) redirect("/superadmin/login");
  if (!isAdminRoleAllowed(admin.role, ["super_admin"])) redirect(`${getAdminPanelPath(admin.role)}/login`);
  const canManage = resource === "users" ? admin.permissions.canManageAdmins : resource === "settings" ? admin.permissions.canManageSettings : resource === "audit-logs" ? false : resource === "invoices" ? admin.permissions.canManageInvoices : admin.permissions.canManageReviews;
  const canRead = resource === "users" ? admin.permissions.canManageAdmins : resource === "settings" ? admin.permissions.canManageSettings : resource === "audit-logs" ? admin.permissions.canViewReports : resource === "invoices" ? admin.permissions.canReadInvoices : admin.permissions.canReadReviews;
  if (!canRead) redirect("/superadmin");
  return <AdminResourceManager resource={resource as Resource} canManage={canManage} adminName={admin.name} />;
}
