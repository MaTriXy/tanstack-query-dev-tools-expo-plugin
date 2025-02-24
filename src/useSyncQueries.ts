import { QueryClient, Query } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { deepEqual } from "fast-equals";
import { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";

interface SyncQueriesMessage {
  queries: ExtendedQuery[];
  device: "ios" | "android" | "web" | "windows" | "macos";
}
const SYNC_QUERIES_MESSAGE_TYPE = "allQueries" as const;

export interface ExtendedQuery extends Query {
  observersCount?: number; //  getObserversCount()
  isQueryStale?: boolean; // isStale()
}
interface Props {
  queryClient: QueryClient | any;
}
export function useSyncQueries({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  const [syncQueriesMessage, setSyncQueriesMessage] =
    useState<SyncQueriesMessage>({
      queries: [],
      device: Platform.OS,
    });
  // Store the previous data states for comparison
  const prevDataRef = useRef<any[]>([]);

  function syncQuries(queries: ExtendedQuery[]): void {
    client?.sendMessage(SYNC_QUERIES_MESSAGE_TYPE, {
      queries,
      device: Platform.OS,
    });
  }

  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient.getQueryCache().findAll();
      // Extract the specific parts of the state we want to compare
      const currentDataStates = allQueries.map((query) => ({
        data: query.state.data,
        // dataUpdateCount: query.state.dataUpdateCount,
        // dataUpdatedAt: query.state.dataUpdatedAt,
        error: query.state.error,
        // errorUpdateCount: query.state.errorUpdateCount,
        // errorUpdatedAt: query.state.errorUpdatedAt,
        // fetchFailureCount: query.state.fetchFailureCount,
        fetchFailureReason: query.state.fetchFailureReason,
        fetchMeta: query.state.fetchMeta,
        fetchStatus: query.state.fetchStatus,
        isInvalidated: query.state.isInvalidated,
        status: query.state.status,
      }));
      // Check if the specific parts of the state of any query have changed using deep comparison
      if (!deepEqual(prevDataRef.current, currentDataStates)) {
        const newAllQueries = allQueries.map(
          (query: Query) =>
            ({
              ...query,
              observersCount: query.getObserversCount(),
              isQueryStale: query.isStale(),
            }) as ExtendedQuery
        );

        prevDataRef.current = currentDataStates;

        // Move state updates to a microtask to avoid render phase updates
        Promise.resolve().then(() => {
          setSyncQueriesMessage({
            queries: allQueries,
            device: Platform.OS,
          });
          syncQuries(newAllQueries);
        });
      }
    };

    // Wrap initial update in microtask
    Promise.resolve().then(updateQueries);

    const unsubscribe = queryClient.getQueryCache().subscribe(updateQueries);
    return () => unsubscribe();
  }, [queryClient]);

  // Broadcast queries again if we re-connect
  useEffect(() => {
    if (syncQueriesMessage.queries.length > 0) {
      Promise.resolve().then(() => syncQuries(syncQueriesMessage.queries));
    }
  }, [client, queryClient]);

  return { isConnected: !!client, syncQueriesMessage, setSyncQueriesMessage };
}
