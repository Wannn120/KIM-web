import { DEFAULT_FIELD } from "@/lib/venue";

/**
 * Database init is no longer responsible for managing field tables.
 * The app uses a single fixed venue configuration instead.
 */
export async function ensureDefaultFieldExists() {
  console.warn("[DB INIT] Field initialization skipped because the Field schema has been removed.");
  return false;
}

/**
 * Retrieves the single configured field used by the application.
 */
export async function getFieldsWithFallback() {
  return [DEFAULT_FIELD];
}
