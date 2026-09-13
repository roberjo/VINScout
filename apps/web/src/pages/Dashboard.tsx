import { useState } from "react";
import { useVehicles } from "../hooks/useVehicles";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { VehicleTable } from "../components/VehicleTable";
import { ReviewQueue } from "../components/ReviewQueue";
import { FilterBar } from "../components/FilterBar";
import type { VehicleFilters } from "../types/vehicle";

function SectionCount({ n }: { n: number }) {
  return (
    <span
      className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: "var(--border)", color: "var(--ink-secondary)" }}
    >
      {n}
    </span>
  );
}

export function Dashboard() {
  const [filters, setFilters] = useState<VehicleFilters>({});
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles(filters);
  const { items: reviewItems, loading: reviewLoading, error: reviewError, removeItem } = useReviewQueue();

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center text-base font-semibold">
            Opportunities
            {!vehiclesLoading && !vehiclesError && <SectionCount n={vehicles.length} />}
          </h2>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
        {vehiclesLoading && <p style={{ color: "var(--ink-muted)" }}>Loading vehicles…</p>}
        {vehiclesError && (
          <p className="badge badge-critical">Error: {vehiclesError}</p>
        )}
        {!vehiclesLoading && !vehiclesError && <VehicleTable vehicles={vehicles} />}
      </section>

      <section className="card p-5">
        <h2 className="flex items-center text-base font-semibold">
          Needs Review
          {!reviewLoading && !reviewError && <SectionCount n={reviewItems.length} />}
        </h2>
        <p className="mb-4 mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Rejected for unverified history. Click through any surfaced report link and record what you find —
          nothing here was auto-checked.
        </p>
        {reviewLoading && <p style={{ color: "var(--ink-muted)" }}>Loading review queue…</p>}
        {reviewError && <p className="badge badge-critical">Error: {reviewError}</p>}
        {!reviewLoading && !reviewError && <ReviewQueue items={reviewItems} onVerified={removeItem} />}
      </section>
    </div>
  );
}
