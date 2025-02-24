import { QueryKey, Query } from "@tanstack/react-query";
import { ExtendedQuery } from "../_types/QueryExternal";
type QueryStatus = "fetching" | "inactive" | "paused" | "stale" | "fresh";

export function getQueryStatusLabel(query: ExtendedQuery): QueryStatus {
  return query.state.fetchStatus === "fetching"
    ? "fetching"
    : !query.observersCount // !query.getObserversCount()
    ? "inactive"
    : query.state.fetchStatus === "paused"
    ? "paused"
    : query.isQueryStale // query.isStale()
    ? "stale"
    : "fresh";
}
