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

interface SyncMessage {
  type: "dehydrated-state";
  state: unknown;
  observers: ObserverState[];
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
      queries.forEach((query) => {
        query.observers.forEach((observer) => {
          observerStates.push({
            queryHash: query.queryHash,
            // @ts-ignore - accessing private options
            options: observer.options,
          });
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
      };

      console.log("expo sending dehydrated state and observers to web");
      client.sendMessage("query-sync", syncMessage);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
