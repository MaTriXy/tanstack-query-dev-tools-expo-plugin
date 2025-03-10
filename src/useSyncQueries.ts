import type { QueryKey } from "@tanstack/query-core";
import { QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

import { Dehydrate } from "./hydration";
import { SyncMessage } from "./types";
// Use type-only imports to prevent runtime dependencies
type QueryActions =
  | "Refetch"
  | "Invalidate"
  | "Reset"
  | "Remove"
  | "Trigger Loading"
  | "Trigger Error"
  | "Data Update";
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
          case "Data Update": {
            queryClient.setQueryData(queryKey, data, {
              updatedAt: Date.now(),
            });
            break;
          }

          case "Trigger Error": {
            console.log("Trigger Error - Not implemented yet");
            // const previousOptions = query.options;
            // query.fetch({
            //   ...previousOptions,
            //   queryFn: () => Promise.reject(new Error("Manual error trigger")),
            //   gcTime: -1,
            // });
            break;
          }

          case "Trigger Loading": {
            console.log("Trigger Loading - Not implemented yet");
            // const previousOptions = query.options;
            // query.fetch({
            //   ...previousOptions,
            //   queryFn: () => new Promise(() => {}), // Never resolves
            //   gcTime: -1,
            // });
            // query.setState({
            //   data: undefined,
            //   status: "pending",
            //   fetchMeta: {
            //     ...query.state.fetchMeta,
            //     // @ts-ignore
            //     __previousQueryOptions: previousOptions,
            //   },
            // });
            break;
          }

          case "Reset": {
            console.log("Reset - Not implemented yet");
            // query.reset();
            break;
          }

          case "Remove": {
            console.log("Remove - Not implemented yet");
            // queryClient.removeQueries({ queryKey });
            break;
          }

          case "Refetch": {
            query.fetch()?.catch(() => {});
            break;
          }

          case "Invalidate": {
            console.log("Invalidate - Not implemented yet");
            // queryClient.invalidateQueries({ queryKey });
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
