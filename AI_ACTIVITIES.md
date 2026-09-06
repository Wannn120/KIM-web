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

### 13. Production database and Vercel runtime repair
- Investigated the live deployment issue where the app worked locally but failed in production because Prisma/Vercel was using the wrong Supabase connection pattern.
- Corrected the runtime configuration so the production environment used the pooled Supabase connection settings appropriate for serverless deployment.
- Updated the Vercel environment variables for `DATABASE_URL` and `DIRECT_URL` to the correct live values and redeployed the app.
- Re-validated the public site after deployment instead of assuming localhost behavior matched production.

### 14. Booking API live validation
- Tested the live booking endpoint against the production website to confirm the app could create bookings successfully after the database env fix.
- Confirmed the production bug was not only code logic but also runtime env alignment with the database provider.
- Verified the booking creation flow was functional again in the public deployment.

### 15. Payment status reconciliation fix
- Traced the payment status bug to incorrect lookup logic when Midtrans identifiers were not UUIDs.
- Fixed the lookup logic so it searches by `transactionId` and `midtransOrderId`, and only includes `bookingId` when the identifier is a valid UUID.
- This resolved the case where successful Midtrans payment results still left bookings and payments in `pending` state.
- Added a regression test to lock the fix so similar non-UUID transaction IDs do not break reconciliation again.

### 16. End-to-end status synchronization hardening
- Ensured successful payment updates propagate to the related booking and invoice state.
- Hardened the reconciliation logic so failed, expired, cancelled, and successful payment events update the database consistently.
- Reduced the chance of duplicate or stale payment state after repeated webhook or callback processing.

### 17. Deployment confirmation and source audit
- Ran the production deploy command with Vercel and confirmed the app completed the deployment successfully.
- Reviewed the live runtime state and source changes instead of relying on assumptions from local development only.
- Cross-checked the code paths for image URLs, booking creation, and payment reconciliation to ensure the fixes matched the production behavior.

### 18. Final verification and production proof
- Confirmed the bug fix with a fresh automated verification run using `npm test -- --runInBand`.
- Verified the final project state with evidence from the test suite: 4 suites passed and 20 tests passed.
- Treated the public deployment as the real source of truth; localhost behavior was not assumed to be equivalent to production.
- Recorded the final set of fixes in the project log so future debugging and handoff work can trace the actual root causes and remedies.

### 19. Popup payment redirect fix
- Identified the popup-only bug where the success flow redirected using the booking ID instead of the actual Midtrans payment transaction ID.
- This caused successful popup payments to land on a success page that could not resolve the right payment record, leaving the booking/payment state stuck in a pending or mismatched condition.
- Fixed the redirect logic so popup and polling success callbacks use the payment transaction ID when available, while still falling back to the booking ID only when needed.
- Persisted transactionId in the client-side payment state so the redirect logic stays aligned with the actual created payment record.
- Added a regression test to cover this popup case and prevent it from recurring.
- Verified with `npm test -- --runInBand` after the fix: 4 test suites passed and 21 tests passed.

### 20. Live stale-slot reclamation fix for expired bookings
- Traced the remaining production blocker to stale expired/cancelled/refunded booking rows that can still conflict with the old legacy unique constraint on the same slot.
- Added a proactive cleanup helper that removes reclaimable slot rows before a new booking is created for the same date and start time.
- Invoked the cleanup in the booking API so the app can reclaim a slot immediately instead of failing with a generic “time slot no longer available” error.
- Hardened the migration SQL to drop legacy unique keys and enforce the partial active-slot index that only blocks currently active bookings.
- Added a regression check to cover the stale-slot case and prevent the same production bug from reappearing.

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
