import { prisma } from "@/lib/prisma";
import { siteContent } from "@/lib/mock-data";
import type { SiteContent } from "@/types";

export const SITE_CONTENT_KEYS = [
  "locationLabel",
  "heroTitle",
  "heroSubtitle",
  "ctaPrimary",
  "ctaSecondary",
  "backgroundImageUrl",
] as const;

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
