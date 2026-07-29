import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedAdminFromToken, getAdminPanelPath, isAdminRoleAllowed } from "@/lib/admin-auth";
import StaffPaymentViewer from "./StaffPaymentViewer";

export const dynamic = "force-dynamic";

export default async function StaffPaymentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/staff/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["staff", "manager", "super_admin"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  return <StaffPaymentViewer adminName={admin.name} />;
}
