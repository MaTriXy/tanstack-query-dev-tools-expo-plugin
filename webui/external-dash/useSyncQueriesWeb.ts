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
        case "removed": // Works
          // Remove button clicked
          console.log("Query removed", {
            queryKey: event.query.queryKey,
            queryHash: event.query.queryHash,
          });
          break;

        case "updated":
          switch (event.action.type) {
            case "fetch":
              if (event.query.state.fetchStatus === "fetching") {
                // Could be either Refetch button or Trigger Loading button
                // You can differentiate by checking if there was previous data
                const isRefetch = event.query.state.data !== undefined;
                console.log(
                  isRefetch ? "Refetch clicked" : "Trigger Loading clicked",
                  {
                    queryKey: event.query.queryKey,
                    queryHash: event.query.queryHash,
                  }
                );
                client.sendMessage("query-action", {
                  queryHash: event.query.queryHash,
                  queryKey: event.query.queryKey,
                  action: isRefetch ? "Refetch" : "Trigger Loading",
                } as QueryActionMessage);
              }
              break;
            case "invalidate":
              // Invalidate button clicked
              console.log("Invalidate clicked", {
                queryKey: event.query.queryKey,
                queryHash: event.query.queryHash,
              });
              break;
            case "setState": {
              // Could be Reset, Trigger Error or Restore Error button
              const isReset =
                event.query.state.dataUpdateCount === 0 &&
                event.query.state.errorUpdateCount === 0 &&
                event.query.state.fetchStatus === "idle";

              // Trigger Error sets both error and __previousQueryOptions
              const triggerErrorClicked =
                event.action.state.error !== null &&
                (event.action.state.fetchMeta as ExtendedFetchMeta)
                  ?.__previousQueryOptions !== undefined;

              // For Restore Error:
              // - Query state has error (state.status === 'error')
              // - Action transitions to pending status with null error
              const restoreErrorClicked =
                event.query.state.status === "error" &&
                event.action.state.status === "pending" &&
                event.action.state.error === null &&
                event.action.state.fetchStatus === "idle";

              if (triggerErrorClicked) {
                // works
                console.log("Trigger Error clicked", {
                  queryKey: event.query.queryKey,
                  queryHash: event.query.queryHash,
                });
              } else if (restoreErrorClicked) {
                console.log("Restore Error clicked", {
                  queryKey: event.query.queryKey,
                  queryHash: event.query.queryHash,
                });
              } else if (isReset) {
                console.log("Reset clicked", {
                  queryKey: event.query.queryKey,
                  queryHash: event.query.queryHash,
                });
              }
              break;
            }
            case "success":
              // works
              if (event.action.manual) {
                console.log("Manual update", {
                  queryKey: event.query.queryKey,
                  queryHash: event.query.queryHash,
                });
                // Send manualquery update to client
                client.sendMessage("query-action", {
                  queryHash: event.query.queryHash,
                  queryKey: event.query.queryKey,
                  data: event.query.state.data,
                  action: "Data Update",
                } as QueryActionMessage);
              }
              break;
          }
          break;
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
