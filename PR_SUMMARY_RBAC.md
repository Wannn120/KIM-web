PR: Enforce RBAC for Admin APIs and UI

Summary
- Add distinct permission sets for `staff`, `manager`, and `super_admin` in `lib/admin-auth.ts`.
- Protect admin API endpoints to require authentication and appropriate permissions (fields, summary, audit-logs, export, query, etc.).
- Add server-side guard for the SQL editor at `app/sql-editor/page.tsx` and extracted client component `app/sql-editor/SqlEditorClient.tsx` to ensure only `canManageAdmins` can access it.
- Protect `app/api/admin/fields` and `app/api/admin/fields/[id]` (GET/POST/PUT/DELETE) with `canManageFields` permission.
- Minor bugfix: await `cookies()` in server components and small build fixes.

Files changed (high level)
- `lib/admin-auth.ts`
- `app/api/admin/fields/route.ts`
- `app/api/admin/fields/[id]/route.ts`
- `app/sql-editor/page.tsx`
- `app/sql-editor/SqlEditorClient.tsx` (new)

Testing performed
- Local `npm run build` completed successfully after changes.
- Verified admin routes now return 401/403 where appropriate.

Migration notes
- If you seed roles/permissions on startup, ensure `manager` and `staff` default permissions match the new expectations.

How to review
1. Checkout branch `feat/rbac-permissions`.
2. Run `npm run build` and inspect admin endpoints with and without `admin-session` cookie.
3. Log in as different admin roles and verify UI shows/hides features accordingly.

Next steps (optional)
- Propagate RBAC checks to any remaining admin UIs (forms, buttons) that still assume full admin access.
- Add automated integration tests to assert 403 responses for unauthorized roles.
