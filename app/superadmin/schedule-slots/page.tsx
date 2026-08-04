import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPanelPath, getAuthenticatedAdminFromToken, isAdminRoleAllowed } from "@/lib/admin-auth";
import ScheduleSlotManagerClient from "@/app/manager/schedule-slots/ScheduleSlotManagerClient";

export const dynamic = "force-dynamic";

export default async function SuperadminScheduleSlotsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value ?? "";
  const admin = await getAuthenticatedAdminFromToken(token);

  if (!admin) {
    redirect("/superadmin/login");
  }

  if (!isAdminRoleAllowed(admin.role, ["super_admin"])) {
    redirect(`${getAdminPanelPath(admin.role)}/login`);
  }

  return <ScheduleSlotManagerClient adminName={admin.name} />;
}
