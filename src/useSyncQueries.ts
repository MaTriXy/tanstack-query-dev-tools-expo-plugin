import type { QueryCacheNotifyEvent, QueryKey } from "@tanstack/query-core";
import { QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

import { Dehydrate } from "./hydration";
import { SyncMessage } from "./types";
// Use type-only imports to prevent runtime dependencies
interface QueryUpdateMessage {
  queryHash: string;
  queryKey: QueryKey;
  data: unknown;
}
interface Props {
  queryClient: QueryClient;
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
    console.log("Connected");
    // Handle initial state requests from web
    const initialStateSubscription = client.addMessageListener(
      "request-initial-state",
      () => {
        const dehydratedState = Dehydrate(queryClient as any);
        const syncMessage: SyncMessage = {
          type: "dehydrated-state",
          state: dehydratedState,
        };
        client.sendMessage("query-sync", syncMessage);
      }
    );
    // Get manual updates from web
    const manualUpdateSubscription = client.addMessageListener(
      "query-manual-update",
      (message: QueryUpdateMessage) => {
        console.log("Manual update received", message);
        const { queryHash, queryKey, data } = message;

        // Verify the query exists
        const query = queryClient.getQueryCache().get(queryHash);
        if (!query) {
          console.warn(`Query with hash ${queryHash} not found`);
          return;
        }

        // Update the query data
        queryClient.setQueryData(queryKey, data, {
          updatedAt: Date.now(), // Ensure the cache recognizes this as a fresh update
        });

        // Verify the update
        const updatedQuery = queryClient.getQueryCache().get(queryHash);
        console.log("Query after update:", {
          queryKey,
          data: updatedQuery?.state.data,
          updatedAt: updatedQuery?.state.dataUpdatedAt,
        });
      }
    );

    // Subscribe to query changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Dehydrate the current state
      const dehydratedState = Dehydrate(queryClient as any);
      // Create sync message
      const syncMessage: SyncMessage = {
        type: "dehydrated-state",
        state: dehydratedState,
      };
      // Send message to web
      client.sendMessage("query-sync", syncMessage);
    });

    return () => {
      manualUpdateSubscription?.remove();
      initialStateSubscription?.remove();
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
