import { AnimatedCard } from "@/components/animated-card";
import { PaymentSimulator } from "./simulator";

export const dynamic = "force-dynamic";

function getSearchParam(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingId = getSearchParam(resolvedSearchParams.bookingId, "BK-0001");
  const amount = Number(getSearchParam(resolvedSearchParams.amount, "170000"));
  const fieldName = getSearchParam(resolvedSearchParams.fieldName, "Elite Turf 1");
  const bookingDate = getSearchParam(resolvedSearchParams.bookingDate, "07 Jul 2026");
  const bookingTime = getSearchParam(resolvedSearchParams.bookingTime, "19:00 - 20:00");
  const customerName = getSearchParam(resolvedSearchParams.customerName, "Demo Customer");

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AnimatedCard className="p-8">
          <PaymentSimulator
            bookingId={bookingId}
            amount={Number.isFinite(amount) ? amount : 170000}
            fieldName={fieldName}
            bookingDate={bookingDate}
            bookingTime={bookingTime}
            customerName={customerName}
          />
        </AnimatedCard>
      </div>
    </main>
  );
}
