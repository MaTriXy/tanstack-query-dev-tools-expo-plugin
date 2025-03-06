import {
  DefaultError,
  DehydratedState,
  QueryClient,
  QueryKey,
  QueryObserverOptions,
  dehydrate,
} from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

interface Props {
  queryClient: QueryClient;
}

interface ObserverState<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  queryHash: string;
  options: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >;
}

interface SyncMessage {
  type: "dehydrated-state";
  state: DehydratedState;
  observers: ObserverState[];
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

    // Handle updates from web -----
    // const webUpdateSubscription = client.addMessageListener(
    //   "query-update-from-web",
    //   (message: { type: string; queryData: any }) => {
    //     if (message.type === "query-update") {
    //       const { queryHash, queryKey, state } = message.queryData;

    //       const query = queryClient.getQueryCache().get(queryHash);
    //       if (query) {
    //         queryClient.setQueryData(queryKey, state.data);
    //       }
    //     }
    //   }
    // );

    // Subscribe to query changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Get all queries
      const queries = queryClient.getQueryCache().findAll();
      // Extract observer states
      const observerStates: ObserverState[] = [];
      // Collect observers
      queries.forEach((query) => {
        query.observers.forEach((observer) => {
          observerStates.push({
            queryHash: query.queryHash,
            options: observer.options,
          });
        });
      });
      // Dehydrate the current state
      const dehydratedState = dehydrate(queryClient, {
        shouldDehydrateQuery: () => true,
        shouldDehydrateMutation: () => true,
      });
      // Create sync message
      const syncMessage: SyncMessage = {
        type: "dehydrated-state",
        state: dehydratedState,
        observers: observerStates,
      };
      // Send message to web
      client.sendMessage("query-sync", syncMessage);
    });

    return () => {
      // webUpdateSubscription?.remove();
      unsubscribe();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
