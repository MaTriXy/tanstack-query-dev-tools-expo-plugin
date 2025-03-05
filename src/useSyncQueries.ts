import { QueryClient, dehydrate } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";
import { Platform } from "react-native";

interface Props {
  queryClient: QueryClient;
}

interface ObserverState {
  queryHash: string;
  options: any;
}

interface QueryStatusState {
  queryHash: string;
  state: {
    status: string;
    fetchStatus: string;
    isInvalidated: boolean;
    isPaused: boolean;
    isStale: boolean;
    dataUpdatedAt: number;
  };
}

interface SyncMessage {
  type: "dehydrated-state";
  state: unknown;
  observers: ObserverState[];
  queryStatuses: QueryStatusState[];
}

export function useSyncQueries({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("no client");
      return;
    }
    console.log("expo client connected, will sync to web");

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Get all queries
      const queries = queryClient.getQueryCache().findAll();

      // Extract observer states
      const observerStates: ObserverState[] = [];
      const queryStatuses: QueryStatusState[] = [];

      queries.forEach((query) => {
        // Collect observers
        query.observers.forEach((observer) => {
          observerStates.push({
            queryHash: query.queryHash,
            // @ts-ignore - accessing private options
            options: observer.options,
          });
        });

        // Collect status information
        queryStatuses.push({
          queryHash: query.queryHash,
          state: {
            status: query.state.status,
            fetchStatus: query.state.fetchStatus,
            isInvalidated: query.state.isInvalidated,
            isPaused: query.state.fetchStatus === "paused",
            isStale: query.isStale(),
            dataUpdatedAt: query.state.dataUpdatedAt,
          },
        });
      });

      // Dehydrate the current state
      const dehydratedState = dehydrate(queryClient, {
        shouldDehydrateQuery: () => true,
        shouldDehydrateMutation: () => true,
      });

      const syncMessage: SyncMessage = {
        type: "dehydrated-state",
        state: dehydratedState,
        observers: observerStates,
        queryStatuses,
      };

      console.log(
        "expo sending dehydrated state, observers, and statuses to web"
      );
      client.sendMessage("query-sync", syncMessage);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
