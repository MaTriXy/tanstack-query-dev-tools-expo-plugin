import type { QueryKey } from "@tanstack/query-core";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import * as Device from "expo-device";
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
  | "ACTION-ONLINE-MANAGER-ONLINE"
  | "ACTION-ONLINE-MANAGER-OFFLINE"
  | "success";
interface QueryActionMessage {
  queryHash: string;
  queryKey: QueryKey;
  data: unknown;
  action: QueryActions;
}
interface DeviceInfoMessage {
  Device: typeof Device;
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
          Device,
        };
        client.sendMessage("query-sync", syncMessage);
      }
    );
    // Online manager handler
    const onlineManagerSubscription = client.addMessageListener(
      "online-manager",
      (message: QueryActionMessage) => {
        const { action } = message;
        switch (action) {
          case "ACTION-ONLINE-MANAGER-ONLINE": {
            onlineManager.setOnline(true);
            break;
          }
          case "ACTION-ONLINE-MANAGER-OFFLINE": {
            onlineManager.setOnline(false);
            break;
          }
        }
      }
    );
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
            activeQuery.setState({
              status: "error",
              error,
              fetchMeta: {
                ...activeQuery.state.fetchMeta,
                // @ts-ignore This does exist
                __previousQueryOptions,
              },
            });
            break;
          }
          case "ACTION-RESTORE-ERROR": {
            const promise = activeQuery.fetch();
            promise.catch(() => {});
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
            activeQuery.setState({
              data: undefined,
              status: "pending",
              fetchMeta: {
                ...activeQuery.state.fetchMeta,
                // @ts-ignore This does exist
                __previousQueryOptions,
              },
            });
            break;
          }
          case "ACTION-RESTORE-LOADING": {
            const promise = activeQuery.fetch();
            promise.catch(() => {});
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
          case "ACTION-ONLINE-MANAGER-ONLINE": {
            onlineManager.setOnline(true);
            break;
          }
          case "ACTION-ONLINE-MANAGER-OFFLINE": {
            onlineManager.setOnline(false);
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
        Device,
      };
      // Send message to web
      client.sendMessage("query-sync", syncMessage);
    });
    // Handle device info request
    const deviceInfoSubscription = client.addMessageListener(
      "device-request",
      () => {
        const syncMessage: DeviceInfoMessage = {
          Device,
        };
        client.sendMessage("device-info", syncMessage);
      }
    );
    return () => {
      queryActionSubscription?.remove();
      initialStateSubscription?.remove();
      onlineManagerSubscription?.remove();
      unsubscribe();
      deviceInfoSubscription?.remove();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
