import { useState } from "react";
import { useVehicles } from "../hooks/useVehicles";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { useFacets } from "../hooks/useFacets";
import { VehicleTable } from "../components/VehicleTable";
import { ReviewQueue } from "../components/ReviewQueue";
import { FilterBar } from "../components/FilterBar";
import { Pagination } from "../components/Pagination";
import { WatchlistManager } from "../components/WatchlistManager";
import { fetchReviewQueueFacets, fetchVehicleFacets } from "../services/vehiclesApi";
import type { VehicleFilters, VehicleSort } from "../types/vehicle";
import type { ReviewSort } from "../types/review";

const DEFAULT_VEHICLE_SORT: VehicleSort = { sortBy: "opportunityScore", sortDir: "desc" };
const DEFAULT_REVIEW_SORT: ReviewSort = { sortBy: "firstSeenAt", sortDir: "desc" };

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
  const [facetsReloadKey, setFacetsReloadKey] = useState(0);
  const vehicleFacets = useFacets(fetchVehicleFacets, facetsReloadKey);
  const reviewFacets = useFacets(fetchReviewQueueFacets, facetsReloadKey);

  const [filters, setFilters] = useState<VehicleFilters>({});
  const [sort, setSort] = useState<VehicleSort>(DEFAULT_VEHICLE_SORT);
  const {
    vehicles,
    total,
    page,
    pageSize,
    setPage,
    loading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useVehicles(filters, sort);

  const [reviewFilters, setReviewFilters] = useState<VehicleFilters>({});
  const [reviewSort, setReviewSort] = useState<ReviewSort>(DEFAULT_REVIEW_SORT);
  const {
    items: reviewItems,
    total: reviewTotal,
    page: reviewPage,
    pageSize: reviewPageSize,
    setPage: setReviewPage,
    loading: reviewLoading,
    error: reviewError,
    refetch: refetchReviewQueue,
  } = useReviewQueue(reviewFilters, reviewSort);

  // A verification can move a vehicle out of the review queue and straight
  // into Opportunities (if it passed) — both lists need to refresh, not just
  // the one the review form lives in, or a newly-approved vehicle silently
  // wouldn't appear until a full page reload. Same for the make/model
  // dropdowns, which are scoped to each section's set of vehicles.
  const handleVerified = () => {
    refetchReviewQueue();
    refetchVehicles();
    setFacetsReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-4 text-base font-semibold">Saved Searches</h2>
        <WatchlistManager />
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center text-base font-semibold">
            Opportunities
            {!vehiclesLoading && !vehiclesError && <SectionCount n={total} />}
          </h2>
        </div>
        <FilterBar filters={filters} onChange={setFilters} facets={vehicleFacets} />
        {vehiclesLoading && <p style={{ color: "var(--ink-muted)" }}>Loading vehicles…</p>}
        {vehiclesError && (
          <p className="badge badge-critical">Error: {vehiclesError}</p>
        )}
        {!vehiclesLoading && !vehiclesError && (
          <>
            <VehicleTable vehicles={vehicles} sort={sort} onSortChange={setSort} />
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )}
      </section>

      <section className="card p-5">
        <h2 className="flex items-center text-base font-semibold">
          Needs Review
          {!reviewLoading && !reviewError && <SectionCount n={reviewTotal} />}
        </h2>
        <p className="mb-4 mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
          Rejected for unverified history. Click through any surfaced report link and record what you find —
          nothing here was auto-checked.
        </p>
        <FilterBar filters={reviewFilters} onChange={setReviewFilters} facets={reviewFacets} />
        {reviewLoading && <p style={{ color: "var(--ink-muted)" }}>Loading review queue…</p>}
        {reviewError && <p className="badge badge-critical">Error: {reviewError}</p>}
        {!reviewLoading && !reviewError && (
          <>
            <ReviewQueue items={reviewItems} sort={reviewSort} onSortChange={setReviewSort} onVerified={handleVerified} />
            <Pagination page={reviewPage} pageSize={reviewPageSize} total={reviewTotal} onPageChange={setReviewPage} />
          </>
        )}
      </section>
    </div>
  );
}
