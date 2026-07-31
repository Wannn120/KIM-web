import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import StaffFieldViewer from "./StaffFieldViewer";

export const dynamic = "force-dynamic";

export default async function StaffFieldsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/staff/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["staff"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  if (!admin.permissions.canReadFields) {
    redirect("/staff");
  }

  return <StaffFieldViewer adminName={admin.name} />;
}
