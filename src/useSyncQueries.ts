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
  targetDevice: string;
}
interface DeviceInfoMessage {
  Device: typeof Device;
}
interface Props {
  queryClient: QueryClient;
}

function shouldProcessMessage(
  targetDevice: string,
  currentDeviceName: string
): boolean {
  const shouldProcess =
    targetDevice === currentDeviceName || targetDevice === "All";
  console.log(
    `Message processing: target=${targetDevice}, current=${currentDeviceName}, ` +
      `will process=${shouldProcess}`
  );
  return shouldProcess;
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
    // Online manager handler - Turn device internet connection on/off
    const onlineManagerSubscription = client.addMessageListener(
      "online-manager",
      (message: QueryActionMessage) => {
        const { action, targetDevice } = message;
        // Only process if the target device is the current device or "All"
        if (targetDevice !== Device.deviceName && targetDevice !== "All") {
          return;
        }
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
    // Query Actions handler - Update query data, trigger errors, etc.
    const queryActionSubscription = client.addMessageListener(
      "query-action",
      (message: QueryActionMessage) => {
        const { queryHash, queryKey, data, action, targetDevice } = message;

        // Centralize the device check
        if (!shouldProcessMessage(targetDevice, Device.deviceName || "")) {
          console.log(
            `Ignoring action for device ${targetDevice}, current device is ${Device.deviceName}`
          );
          return;
        }

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
            queryClient.resetQueries(activeQuery);
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

    // Subscribe to query changes - Send query state to web
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
    // Handle device info request - Send device info to web
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
