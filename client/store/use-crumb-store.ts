import { create } from "zustand";

import type { Crumb } from "@/components/workspace/breadcrumbs";

interface CrumbState {
  /** Set by the deepest page. The context bar reads it. */
  trail: Crumb[];
  setTrail: (trail: Crumb[]) => void;
  clearTrail: () => void;
}

/**
 * Breadcrumbs for the workspace context bar.
 *
 * The bar sits above every route, so it cannot know the name of the record a
 * detail route is showing — `/projects/abc` yields nothing but an id. The page
 * itself knows, so it publishes its trail here and the bar renders it.
 *
 * Kept deliberately shallow: a page sets its trail on mount and clears it on
 * unmount, so navigating away always leaves an honest bar rather than a stale one.
 */
export const useCrumbStore = create<CrumbState>((set) => ({
  trail: [],
  setTrail: (trail) => set({ trail }),
  clearTrail: () => set({ trail: [] }),
}));

export default useCrumbStore;
