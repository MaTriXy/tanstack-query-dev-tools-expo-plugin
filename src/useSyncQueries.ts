import type { QueryKey, QueryState } from "@tanstack/query-core";
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
        const activeQuery = queryClient.getQueryCache().get(queryHash);

        if (!activeQuery) {
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
            const error = new Error("Unknown error from devtools");

            const __previousQueryOptions = activeQuery.options;
            // @ts-ignore
            activeQuery.setState({
              status: "error",
              error,
              fetchMeta: {
                ...activeQuery.state.fetchMeta,
                __previousQueryOptions,
              },
            } as QueryState<unknown, Error>);
            break;
          }
          case "ACTION-RESTORE-ERROR": {
            const previousState = activeQuery.state;
            const previousOptions = activeQuery.state.fetchMeta
              ? (activeQuery.state.fetchMeta as any).__previousQueryOptions
              : null;

            activeQuery.cancel({ silent: true });
            activeQuery.setState({
              ...previousState,
              fetchStatus: "idle",
              fetchMeta: null,
            });

            if (previousOptions) {
              activeQuery.fetch(previousOptions);
            }
            break;
          }
          case "ACTION-TRIGGER-LOADING": {
            if (!activeQuery) return;
            const __previousQueryOptions = activeQuery.options;
            // Trigger a fetch in order to trigger suspense as well.
            activeQuery.fetch({
              ...__previousQueryOptions,
              queryFn: () => {
                return new Promise(() => {
                  // Never resolve
                });
              },
              gcTime: -1,
            });
            // @ts-ignore
            activeQuery.setState({
              data: undefined,
              status: "pending",
              fetchMeta: {
                ...activeQuery.state.fetchMeta,
                __previousQueryOptions,
              },
            } as QueryState<unknown, Error>);
            break;
          }
          case "ACTION-RESTORE-LOADING": {
            const previousState = activeQuery.state;
            const previousOptions = activeQuery.state.fetchMeta
              ? (activeQuery.state.fetchMeta as any).__previousQueryOptions
              : null;

            activeQuery.cancel({ silent: true });
            activeQuery.setState({
              ...previousState,
              fetchStatus: "idle",
              fetchMeta: null,
            });

            if (previousOptions) {
              activeQuery.fetch(previousOptions);
            }
            break;
          }
          case "ACTION-RESET": {
            queryClient.resetQueries(activeQuery);
            break;
          }
          case "ACTION-REMOVE": {
            queryClient.removeQueries(activeQuery);
            break;
          }
          case "ACTION-REFETCH": {
            const promise = activeQuery.fetch();
            promise.catch(() => {});
            break;
          }
          case "ACTION-INVALIDATE": {
            queryClient.invalidateQueries(activeQuery);
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
