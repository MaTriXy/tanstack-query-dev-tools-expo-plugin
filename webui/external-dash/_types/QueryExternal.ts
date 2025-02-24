import { Query } from "@tanstack/react-query";
export interface ExtendedQuery extends Query {
  observersCount?: number; // Add the observersCount property to the Query
  isQueryStale?: boolean; // isStale()
}
