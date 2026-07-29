import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import StaffFieldViewer from "@/app/staff/fields/StaffFieldViewer";

export const dynamic = "force-dynamic";

export default async function AdminFieldsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/staff/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["staff"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  return <StaffFieldViewer adminName={admin.name} />;
}
