import { useCallback, useEffect, useState } from "react";
import type { ReviewQueueItem } from "../types/review";
import { fetchReviewQueue } from "../services/vehiclesApi";

interface UseReviewQueueResult {
  items: ReviewQueueItem[];
  loading: boolean;
  error: string | null;
  removeItem: (vin: string) => void;
}

export function useReviewQueue(): UseReviewQueueResult {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchReviewQueue()
      .then((data) => {
        if (!cancelled) setItems(data);
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
  }, []);

  const removeItem = useCallback((vin: string) => {
    setItems((current) => current.filter((item) => item.vin !== vin));
  }, []);

  return { items, loading, error, removeItem };
}
