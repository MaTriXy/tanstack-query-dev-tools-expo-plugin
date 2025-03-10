import { QueryClient, QueryOptions } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

// Update the import path to use the configured alias
import { Hydrate } from "src/hydration";
import { SyncMessage } from "src/types";

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
    // log out events fetch, query data updates , etc
    // queryClient.getQueryCache().subscribe((event) => {
    //   switch (event.type) {
    //     case "added":
    //       // event.query available
    //       console.log("added", event);
    //       break;
    //     case "removed":
    //       // event.query available
    //       console.log("removed", event);
    //       break;
    //     case "updated":
    //       // event.query and event.action available
    //       switch (event.action.type) {
    //         case "fetch":
    //           // Refetch Action
    //           console.log("fetch", event);
    //           break;
    //         case "success":
    //           console.log("success", event);
    //           break;
    //         case "error":
    //           // Ignore error events
    //           console.log("error", event);
    //           break;
    //         case "invalidate":
    //           // Invalidate Action
    //           console.log("invalidate", event);
    //           break;
    //         case "pause":
    //           console.log("pause", event);
    //           break;
    //         case "continue":
    //           console.log("continue", event);
    //           break;
    //         case "setState":
    //           console.log("setState", event);
    //           break;
    //       }
    //       break;
    //     case "observerAdded":
    //       // event.query and event.observer available
    //       break;
    //     case "observerRemoved":
    //       // event.query and event.observer available
    //       break;
    //     case "observerResultsUpdated":
    //       // event.query available
    //       break;
    //   }
    // });
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
              console.log("setState Debug:", {
                // Previous state
                previousStateHadError: event.query.state.error !== null,

                // Current action state
                actionState: {
                  error: event.action.state.error,
                  status: event.action.state.status,
                  fetchStatus: event.action.state.fetchStatus,
                  fetchMeta: event.action.state.fetchMeta,
                },

                // Query state
                queryState: {
                  error: event.query.state.error,
                  status: event.query.state.status,
                  fetchStatus: event.query.state.fetchStatus,
                  dataUpdateCount: event.query.state.dataUpdateCount,
                  errorUpdateCount: event.query.state.errorUpdateCount,
                },

                // Full event for reference
                fullEvent: event,
              });
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
                // Send manualquery update to client
                client.sendMessage("query-manual-update", {
                  queryHash: event.query.queryHash,
                  queryKey: event.query.queryKey,
                  data: event.query.state.data,
                });
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
