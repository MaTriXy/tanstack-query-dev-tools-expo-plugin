import { QueryClient, QueryKey, QueryOptions } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

import { Hydrate } from "./shared/hydration";
import { SyncMessage } from "./shared/types";
// Recreate the internal FetchMeta interface
interface FetchMeta {
  fetchMore?: { direction: "forward" | "backward" };
}
// Extend it with the devtools-specific properties
interface ExtendedFetchMeta extends FetchMeta {
  __previousQueryOptions?: QueryOptions<unknown, Error, unknown>;
}

interface Props {
  queryClient: QueryClient;
}

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

export function useSyncQueriesWeb({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("No client");
      return;
    }
    console.log("Connected");
    // Request initial state when web client connects
    client.sendMessage("request-initial-state", {
      type: "initial-state-request",
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
          // Hydrate sets initial data state
          hydrateState(queryClient, message);
        }
      }
    );

    return () => {
      subscription?.remove();
    };
  }, [queryClient, client]);

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
