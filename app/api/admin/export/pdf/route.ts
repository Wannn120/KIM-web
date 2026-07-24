import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ROLES, getAuthenticatedAdmin, isAdminRoleAllowed } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
  }

  if (!isAdminRoleAllowed(admin.role, [ADMIN_ROLES.manager, ADMIN_ROLES.superAdmin])) {
    return NextResponse.json({ success: false, message: "Insufficient admin privileges." }, { status: 403 });
  }

  const pdfContent = "%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length 44 >>stream\nBT /F1 18 Tf 50 100 Td (MiniSoccer Admin Report) Tj ET\nendstream\nendobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000119 00000 n \n0000000207 00000 n \n0000000300 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF";

  return new NextResponse(pdfContent, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=admin-report.pdf",
    },
  });
}
