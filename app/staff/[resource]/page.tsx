import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPanelPath, getAuthenticatedAdminFromToken, isAdminRoleAllowed } from "@/lib/admin-auth";
import AdminResourceManager from "@/components/admin-resource-manager";

export const dynamic = "force-dynamic";
const resources = ["reviews"] as const;
type Resource = (typeof resources)[number];

export default async function StaffResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!resources.includes(resource as Resource)) redirect("/staff");
  const admin = await getAuthenticatedAdminFromToken((await cookies()).get("admin-session")?.value ?? "");
  if (!admin) redirect("/staff/login");
  if (!isAdminRoleAllowed(admin.role, ["staff"])) redirect(`${getAdminPanelPath(admin.role)}/login`);
  const canRead = admin.permissions.canReadReviews;
  if (!canRead) redirect("/staff");
  return <AdminResourceManager resource={resource as Resource} canManage={false} adminName={admin.name} />;
}
