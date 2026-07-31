import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPanelPath, getAuthenticatedAdminFromToken, isAdminRoleAllowed } from "@/lib/admin-auth";
import AdminResourceManager from "@/components/admin-resource-manager";

export const dynamic = "force-dynamic";
const resources = ["invoices", "reviews", "settings"] as const;
type Resource = (typeof resources)[number];

export default async function ManagerResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!resources.includes(resource as Resource)) redirect("/manager");
  const admin = await getAuthenticatedAdminFromToken((await cookies()).get("admin-session")?.value ?? "");
  if (!admin) redirect("/manager/login");
  if (!isAdminRoleAllowed(admin.role, ["manager", "super_admin"])) redirect(`${getAdminPanelPath(admin.role)}/login`);
  const canManage = resource === "invoices" ? admin.permissions.canManageInvoices : resource === "reviews" ? admin.permissions.canManageReviews : admin.permissions.canManageSettings;
  const canRead = resource === "invoices" ? admin.permissions.canReadInvoices : resource === "reviews" ? admin.permissions.canReadReviews : admin.permissions.canManageSettings;
  if (!canRead) redirect(getAdminPanelPath(admin.role));
  return <AdminResourceManager resource={resource as Resource} canManage={canManage} adminName={admin.name} />;
}
