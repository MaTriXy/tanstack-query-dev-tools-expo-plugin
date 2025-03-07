import {
  QueryClient,
  QueryObserver,
  DehydratedState,
  QueryObserverOptions,
  QueryKey,
  DefaultError,
} from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";

import { customHydrate } from "./hydration";

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

    const subscription = client.addMessageListener(
      "query-sync",
      (message: SyncMessage) => {
        if (message.type === "dehydrated-state") {
          // Clean up observers
          cleanUpObservers(queryClient);
          // Hydrate sets initial data state
          hydrateState(queryClient, message);
          // Recreate observers
          recreateObservers(queryClient, message);
        }
      }
    );

    return () => {
      subscription?.remove();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}

// Clean up existing observers
function cleanUpObservers(queryClient: QueryClient) {
  queryClient
    .getQueryCache()
    .getAll()
    .forEach((query) => {
      const observers = query.observers;
      observers.forEach((observer) => {
        query.removeObserver(observer);
      });
    });
}
// Recreate observers
function recreateObservers(queryClient: QueryClient, message: SyncMessage) {
  message.observers.forEach((observerState) => {
    const query = queryClient.getQueryCache().get(observerState.queryHash);
    if (query) {
      const observer = new QueryObserver(queryClient, observerState.options);
      query.addObserver(observer);
    }
  });
}
// Hydrate sets initial data state
function hydrateState(queryClient: QueryClient, message: SyncMessage) {
  customHydrate(queryClient, message.state, {
    defaultOptions: {
      queries: {
        // @ts-ignore  accessing private property
        staleTime: Infinity,
      },
    },
  });
}
