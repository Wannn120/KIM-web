import { prisma } from "@/lib/prisma";
import { siteContent } from "@/lib/mock-data";
import { getDefaultFieldPrice } from "@/lib/venue";
import type { SiteContent } from "@/types";

export const SITE_CONTENT_KEYS = [
  "locationLabel",
  "heroTitle",
  "heroSubtitle",
  "ctaPrimary",
  "ctaSecondary",
  "backgroundImageUrl",
] as const;

export const FIELD_HOURLY_RATE_KEY = "field_hourly_rate";

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const records = await prisma.adminSetting.findMany({ where: { key: { in: [...SITE_CONTENT_KEYS] } } });
    const values = Object.fromEntries(records.map((record) => [record.key, record.value]));
    const merged = { ...siteContent, ...values } as SiteContent;
    if (!merged.backgroundImageUrl) {
      merged.backgroundImageUrl = siteContent.backgroundImageUrl;
    }
    return merged;
  } catch (error) {
    console.error("[CONTENT] Unable to load site content:", error);
    return siteContent;
  }
}

export async function getFieldHourlyRate(defaultPrice = getDefaultFieldPrice()): Promise<number> {
  try {
    const record = await prisma.adminSetting.findUnique({ where: { key: FIELD_HOURLY_RATE_KEY } });
    if (!record) {
      return defaultPrice;
    }
    const value = Number(record.value);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : defaultPrice;
  } catch (error) {
    console.error("[SETTINGS] Unable to load field hourly rate:", error);
    return defaultPrice;
  }
}

export async function saveSiteContent(values: Partial<SiteContent>) {
  await Promise.all(
    SITE_CONTENT_KEYS.filter((key) => typeof values[key] === "string").map((key) =>
      prisma.adminSetting.upsert({
        where: { key },
        update: { value: values[key] as string },
        create: { key, value: values[key] as string, description: `Public website content: ${key}` },
      }),
    ),
  );
  return getSiteContent();
}
