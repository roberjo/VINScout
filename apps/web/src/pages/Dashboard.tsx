import { useVehicles } from "../hooks/useVehicles";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { VehicleTable } from "../components/VehicleTable";
import { ReviewQueue } from "../components/ReviewQueue";

export function Dashboard() {
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles();
  const { items: reviewItems, loading: reviewLoading, error: reviewError, removeItem } = useReviewQueue();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Opportunities</h2>
        {vehiclesLoading && <p className="text-slate-400">Loading vehicles…</p>}
        {vehiclesError && <p className="text-red-400">Error: {vehiclesError}</p>}
        {!vehiclesLoading && !vehiclesError && <VehicleTable vehicles={vehicles} />}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Needs Review</h2>
        <p className="mb-3 text-sm text-slate-400">
          Rejected for unverified history. Click through any surfaced report link and record what you find —
          nothing here was auto-checked.
        </p>
        {reviewLoading && <p className="text-slate-400">Loading review queue…</p>}
        {reviewError && <p className="text-red-400">Error: {reviewError}</p>}
        {!reviewLoading && !reviewError && <ReviewQueue items={reviewItems} onVerified={removeItem} />}
      </section>
    </div>
  );
}
