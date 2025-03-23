import { onlineManager, QueryClient, QueryKey } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import * as Device from "expo-device";
import { useEffect } from "react";

import { Hydrate } from "./shared/hydration";
import { SyncMessage } from "./shared/types";

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
  setDevices: React.Dispatch<React.SetStateAction<(typeof Device)[]>>;
  selectedDevice: string;
  devices: (typeof Device)[];
}

export function useSyncQueriesWeb({
  queryClient,
  setDevices,
  selectedDevice,
  devices,
}: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("No client");
      return;
    }
    console.log("Connected");
    // Get device
    client.sendMessage("device-request", {});
    // Request initial state when web client connects
    client.sendMessage("request-initial-state", {
      type: "initial-state-request",
    });
    // Subscribe to online manager changes
    onlineManager.subscribe((isOnline: boolean) => {
      client.sendMessage("online-manager", {
        action: isOnline
          ? "ACTION-ONLINE-MANAGER-ONLINE"
          : "ACTION-ONLINE-MANAGER-OFFLINE",
      });
    });
    // Subscribe to query changes
    queryClient.getQueryCache().subscribe((event) => {
      switch (event.type) {
        case "updated":
          switch (event.action.type as QueryActions) {
            case "ACTION-REFETCH":
            case "ACTION-INVALIDATE":
            case "ACTION-TRIGGER-ERROR":
            case "ACTION-RESTORE-ERROR":
            case "ACTION-RESET":
            case "ACTION-REMOVE":
            case "ACTION-TRIGGER-LOADING":
            case "ACTION-RESTORE-LOADING":
              client.sendMessage("query-action", {
                queryHash: event.query.queryHash,
                queryKey: event.query.queryKey,
                action: event.action.type as QueryActions,
              } as QueryActionMessage);
              break;
            case "success":
              // @ts-ignore
              if (event.action.manual) {
                // Send manualquery update to client
                client.sendMessage("query-action", {
                  queryHash: event.query.queryHash,
                  queryKey: event.query.queryKey,
                  data: event.query.state.data,
                  action: "ACTION-DATA-UPDATE",
                } as QueryActionMessage);
              }
              break;
          }
      }
    });
    const subscription = client.addMessageListener(
      "query-sync",
      (message: SyncMessage) => {
        if (message.type === "dehydrated-state") {
          // Only process data if it's from the selected device or if "all" is selected
          if (
            selectedDevice === "all" ||
            message.Device.deviceName === selectedDevice
          ) {
            // Hydrate sets initial data state
            hydrateState(queryClient, message);
          }
        }
      }
    );
    // Subscribe to device changes
    client.addMessageListener(
      "device-info",
      (response: { Device: typeof Device }) => {
        setDevices((prevDevices) => {
          const deviceExists = prevDevices.some(
            (device) => device.deviceName === response.Device.deviceName
          );
          if (!deviceExists) {
            return [...prevDevices, response.Device];
          }
          return prevDevices;
        });
      }
    );
    return () => {
      subscription?.remove();
    };
  }, [queryClient, client, selectedDevice]);

  return { isConnected: !!client };
}

// Hydrate sets initial data state
function hydrateState(queryClient: QueryClient, message: SyncMessage) {
  Hydrate(queryClient as any, message.state, {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      } as any,
    },
  });
}
