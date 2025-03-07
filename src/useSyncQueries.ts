import { QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

import { Dehydrate } from "./hydration";
import { SyncMessage } from "./types";

// Use type-only imports to prevent runtime dependencies

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
    // Handle updates from web -----
    const webUpdateSubscription = client.addMessageListener(
      "query-update-from-web",
      (message: { type: string; queryData: any }) => {
        if (message.type === "query-update") {
          const { queryHash, queryKey, state } = message.queryData;
          const query = queryClient.getQueryCache().get(queryHash);
          if (query) {
            queryClient.setQueryData(queryKey, state.data);
          }
        }
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
      // webUpdateSubscription?.remove();
      initialStateSubscription?.remove();
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
