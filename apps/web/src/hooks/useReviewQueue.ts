import { useEffect, useState } from "react";
import type { ReviewQueueItem, ReviewSort } from "../types/review";
import type { VehicleFilters } from "../types/vehicle";
import { fetchReviewQueue } from "../services/vehiclesApi";

const PAGE_SIZE = 25;

interface UseReviewQueueResult {
  items: ReviewQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Resets to page 0 whenever filters or sort change — a stale page number
// from a previous, larger result set would otherwise silently return an
// empty page instead of the results the user just asked for. `refetch` is
// for after a verification: the vehicle just left the REJECTED set the
// query filters on, so the count/page need a real refetch rather than just
// splicing the item out of local state.
export function useReviewQueue(filters: VehicleFilters, sort: ReviewSort): UseReviewQueueResult {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [
    filters.make,
    filters.model,
    filters.priceMin,
    filters.priceMax,
    filters.mileageMax,
    filters.yearMin,
    filters.yearMax,
    sort.sortBy,
    sort.sortDir,
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchReviewQueue(filters, sort, page, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        // Verifying the last item on the last page empties that page — step
        // back to the new last page instead of showing an empty one.
        if (data.items.length === 0 && data.total > 0 && page > 0) {
          setPage(Math.ceil(data.total / PAGE_SIZE) - 1);
          return;
        }
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.make,
    filters.model,
    filters.priceMin,
    filters.priceMax,
    filters.mileageMax,
    filters.yearMin,
    filters.yearMax,
    sort.sortBy,
    sort.sortDir,
    page,
    reloadToken,
  ]);

  const refetch = () => setReloadToken((t) => t + 1);

  return { items, total, page, pageSize: PAGE_SIZE, setPage, loading, error, refetch };
}
