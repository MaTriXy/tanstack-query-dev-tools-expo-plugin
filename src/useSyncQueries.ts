import type { QueryKey } from "@tanstack/query-core";
import { QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

import { Dehydrate } from "./hydration";
import { SyncMessage } from "./types";
// Use type-only imports to prevent runtime dependencies
type QueryActions =
  | "ACTION-REFETCH"
  | "ACTION-INVALIDATE"
  | "ACTION-TRIGGER-ERROR"
  | "ACTION-RESTORE-ERROR"
  | "ACTION-RESET"
  | "ACTION-REMOVE"
  | "ACTION-TRIGGER-LOADING"
  | "ACTION-RESTORE-LOADING"
  | "ACTION-DATA-UPDATE"
  | "success";
interface QueryActionMessage {
  queryHash: string;
  queryKey: QueryKey;
  data: unknown;
  action: QueryActions;
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
    // Query Actions handler
    // Query Actions handler
    const queryActionSubscription = client.addMessageListener(
      "query-action",
      (message: QueryActionMessage) => {
        const { queryHash, queryKey, data, action } = message;
        const query = queryClient.getQueryCache().get(queryHash);

        if (!query) {
          console.warn(`Query with hash ${queryHash} not found`);
          return;
        }

        switch (action) {
          case "ACTION-DATA-UPDATE": {
            queryClient.setQueryData(queryKey, data, {
              updatedAt: Date.now(),
            });
            break;
          }

          case "ACTION-TRIGGER-ERROR": {
            console.log("Trigger Error - Not implemented yet");
            break;
          }
          case "ACTION-RESTORE-ERROR": {
            console.log("Restore Error - Not implemented yet");
            break;
          }
          case "ACTION-TRIGGER-LOADING": {
            console.log("Trigger Loading - Not implemented yet");
            break;
          }
          case "ACTION-RESTORE-LOADING": {
            console.log("Restore Loading - Not implemented yet");
            break;
          }
          case "ACTION-RESET": {
            console.log("Reset - Not implemented yet");
            break;
          }

          case "ACTION-REMOVE": {
            console.log("Remove - Not implemented yet");
            break;
          }

          case "ACTION-REFETCH": {
            query.fetch()?.catch(() => {});
            break;
          }

          case "ACTION-INVALIDATE": {
            console.log("Invalidate - Not implemented yet");
            break;
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
      queryActionSubscription?.remove();
      initialStateSubscription?.remove();
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
