import { QueryClient, hydrate, QueryObserver } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { useEffect } from "react";
import { Platform } from "react-native";

interface Props {
  queryClient: QueryClient;
}

interface ObserverState {
  queryHash: string;
  options: any;
}

interface SyncMessage {
  type: "dehydrated-state";
  state: unknown;
  observers: ObserverState[];
}

export function useSyncQueriesWeb({ queryClient }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  useEffect(() => {
    if (!client) {
      console.log("no client");
      return;
    }
    console.log("web client connected, will receive from expo");

    const subscription = client.addMessageListener(
      "query-sync",
      (message: SyncMessage) => {
        if (message.type === "dehydrated-state") {
          console.log("web received dehydrated state from expo");

          // First, clean up existing observers
          queryClient
            .getQueryCache()
            .getAll()
            .forEach((query) => {
              // @ts-ignore - accessing private property
              const observers = [...query.observers];
              observers.forEach((observer) => {
                // @ts-ignore - accessing private method
                query.removeObserver(observer);
              });
            });

          // Then hydrate the state
          hydrate(queryClient, message.state, {
            defaultOptions: {
              queries: {
                // @ts-ignore - accessing private property
                staleTime: Infinity,
              },
            },
          });

          // Finally, recreate observers
          message.observers.forEach((observerState) => {
            const query = queryClient
              .getQueryCache()
              .get(observerState.queryHash);
            if (query) {
              const observer = new QueryObserver(
                queryClient,
                observerState.options
              );

              // @ts-ignore - accessing private method
              query.addObserver(observer);
            }
          });
        }
      }
    );

    return () => {
      subscription?.remove();
    };
  }, [queryClient, client]);

  return { isConnected: !!client };
}
