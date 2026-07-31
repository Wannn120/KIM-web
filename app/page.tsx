import type { Metadata } from "next";
import type { Review } from "@/types";
import { HeroSection } from "@/components/hero-section";
import { ReviewSection } from "@/components/review-section";
import { SectionHeading } from "@/components/section-heading";
import { getReviews, getVenueFeatures, getVenueGallery } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";
import { getSiteContent } from "@/lib/site-content";
import { DEFAULT_FIELD_PRICE } from "@/lib/venue";
import CurveCarousel from "@/components/gallery/CurveCarousel";

export const metadata: Metadata = {
  title: "Booking Lapangan Mini Soccer di Klaten",
  description:
    "Pesan lapangan mini soccer di Klaten secara online dengan fasilitas lengkap, jadwal fleksibel, dan pembayaran aman.",
  alternates: {
    canonical: "/",
  },
};

export const dynamic = "force-dynamic";

async function loadReviews() {
  return await getReviews();
}

export default async function Home() {
  let reviews: Review[] = [];
  const features = await getVenueFeatures();
  const gallery = await getVenueGallery();
  const content = await getSiteContent();
  
  try {
    reviews = await loadReviews();
  } catch (error) {
    console.error('❌ Failed to load reviews:', error);
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: siteConfig.name,
    url: siteConfig.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Klaten",
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    description: siteConfig.description,
    sameAs: [siteConfig.url],
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <HeroSection facilities={features} content={content} />

      <CurveCarousel images={gallery} price={DEFAULT_FIELD_PRICE} />

      <ReviewSection initialReviews={reviews} />

      <section aria-labelledby="location-heading" className="rounded-[3rem] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-6 py-16 shadow-[0_24px_80px_rgba(15,23,42,0.06)] lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Lokasi lapangan"
                title="Temukan lapangan kami di Klaten"
                id="location-heading"
                titleClassName="text-white"
              />
              <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
                Lapangan terletak strategis, mudah dijangkau, dan didukung fasilitas pendukung untuk tim mini soccer.
              </p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border-strong)] bg-[color:var(--surface)]">
              <iframe
                title="Klaten International Minisoccer location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=110.5950%2C-7.7210%2C110.6110%2C-7.7020&layer=mapnik"
                className="h-[360px] w-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
