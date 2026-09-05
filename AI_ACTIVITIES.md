# AI Activities Log

This file records the main activities, changes, fixes, and decisions made by the AI agent during the development and maintenance of this project.

## 2026-09-05

### 1. Payment flow reliability improvements
- Investigated and fixed the issue where successful payments still left booking status as pending.
- Ensured booking status updates and payment reconciliation are handled consistently after successful payment completion.
- Hardened the payment flow against duplicate or repeated processing paths.

### 2. Duplicate payment link prevention
- Prevented creation of a new payment link when the customer revisits an existing payment flow.
- Reused ongoing pending payment records instead of generating duplicate transactions for the same booking.

### 3. Webhook and idempotency protection
- Added deduplication safeguards around webhook processing to avoid repeated events causing inconsistent state.
- Standardized provider/order lookup logic to make reconciliation more stable.

### 4. Invoice and email notification flow
- Implemented invoice generation flow tied to successful payment processing.
- Wired the notification system to send invoice or receipt communications through Resend when configured.
- Kept the email flow aligned with the payment lifecycle so it is triggered only when the transaction state is valid.

### 5. Slot selection visual fix
- Updated the booking slot UI so selected time slots use a bright green filled state instead of only a border highlight.
- Ensured the selected slot card background, border, and text remain visually strong and readable.
- Updated the hover and selected visual state for better contrast.

### 6. Booked slot styling fix
- Changed booked/unavailable slot cards to a strong red filled color so they are clearly distinguishable from available and selected slots.
- Kept the visual language consistent across all slot states.

### 7. CI/CD workflow repair
- Fixed the GitHub Actions build issue caused by the native dependency problem in the Next.js/Tailwind pipeline.
- Restored the normal dependency installation flow for CI using `npm ci`.
- Kept env validation in place and prevented migration-status checks from failing the pipeline unnecessarily.

### 8. Secret and env hygiene cleanup
- Ensured real environment files are not left tracked in the repository.
- Kept `.env.example` as the safe tracked template for required variables.
- Updated `.gitignore` to ignore local env files while allowing the example file to remain committed.

### 9. Validation performed
- Verified the app with `npm test -- --runInBand`.
- Verified production build with `npm run vercel-build` using placeholder environment values.
- Confirmed the production build succeeds after the workflow fixes.

## 2026-09-06

### 10. Final image regression fix and DB-first asset loading
- Investigated the remaining issue where the homepage still showed stale Unsplash images even after the database values were confirmed correct.
- Traced the actual render path and found that the app still had stale fallback values and default data objects that were overriding valid DB content.
- Removed hardcoded image fallbacks from the main content and mock/default objects so valid database URLs are no longer replaced by legacy Unsplash sources.
- Updated the hero and facility rendering logic to only render remote images if the URL is valid, otherwise use a safe placeholder/gradient instead of requesting a stale remote asset.
- Kept the site content logic DB-first, with strict validation for image URLs before accepting values.

### 11. Seed and config cleanup for production safety
- Removed stale Unsplash URLs from the database seed script so fresh environments no longer get legacy image references by default.
- Removed Unsplash from the production image remote config and tightened CSP rules to only allow required hosts for the app and payment provider.
- Confirmed there are no remaining stale Unsplash references in the project source, seed scripts, and key config files.

### 12. Verification and regression checks
- Ran `npm test -- --runInBand` and verified all tests pass.
- Confirmed the project no longer contains stale Unsplash image URL patterns in the main codebase.
- Verified the fix through source audit and test coverage rather than just relying on redeploy status.

## Current Status

- The frontend slot selection behavior is fixed and visually clear for available, selected, and booked states.
- The GitHub Actions build pipeline is repaired and the CI build command now completes successfully in local validation.
- Secret cleanup is complete from the repository state; real credentials should stay in GitHub/Vercel secrets only.
- The remaining stale image issue was traced to code-level fallback data, not database configuration, and was fixed.
- The project is in a stable source state with cleaner DB-first image handling and a verified test pass.
- Any remaining live deployment issues are environment-dependent, especially database credentials, Midtrans keys, and email provider configuration in the hosting platform.

## Notes

- Real secrets must be stored in GitHub/Vercel environment variables or in a local untracked `.env` file outside the repository.
- This log is intended to document major AI-driven fixes and changes for future troubleshooting and handoff.
- When a database value is valid, the app should prefer it and avoid legacy fallback data that can silently override correct values.
