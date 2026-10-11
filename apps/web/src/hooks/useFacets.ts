import { useEffect, useState } from "react";
import type { VehicleFacets } from "../types/vehicle";

const EMPTY_FACETS: VehicleFacets = { makes: [], models: [], modelsByMake: {} };

// Dropdown options rarely change — fetched once per mount rather than on
// every filter/sort/page change like the list itself. `reloadKey` refetches
// them when the underlying set does change (a verification moves a vehicle
// between sections, which can add or remove a make/model from either).
export function useFacets(fetcher: () => Promise<VehicleFacets>, reloadKey = 0): VehicleFacets {
  const [facets, setFacets] = useState<VehicleFacets>(EMPTY_FACETS);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setFacets(data);
      })
      .catch(() => {
        // Filter options are a convenience, not core functionality — if this
        // fails, the selects just stay empty ("Any" only) rather than
        // breaking the rest of the section.
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return facets;
}
