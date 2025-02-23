import { Query, QueryClient } from "@tanstack/react-query";
import { useDevToolsPluginClient } from "expo/devtools";
import { deepEqual } from "fast-equals";
import { useEffect, useRef, useState } from "react";

import { ClientQuery } from "./_types/ClientQuery";

export interface ExtendedQuery extends Query {
  observersCount?: number; //  getObserversCount()
  isQueryStale?: boolean; // isStale()
}
interface Props {
  queryClient: QueryClient;
  query: ClientQuery;
}
export function useQueryDevTools({ queryClient, query }: Props) {
  const client = useDevToolsPluginClient(
    "tanstack-query-dev-tools-expo-plugin"
  );

  const [queries, setQueries] = useState<ExtendedQuery[]>([]);
  // Store the previous data states for comparison
  const prevDataRef = useRef<any[]>([]);
  const isConnected = client?.isConnected();

  // useEffect(() => {
  //   const subscriptions: EventSubscription[] = [];

  //   subscriptions.push(
  //     client?.addMessageListener("ping", (data) => {
  //       alert(`Received ping from ${data.from}`);
  //     })
  //   );
  //   client?.sendMessage("ping", { from: "app" });
  // }, [client]);

  // Broadcast queries again if we re-connect

  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient
        .getQueryCache()
        .findAll() as ExtendedQuery[];
      // Extract the specific parts of the state we want to compare
      const currentDataStates = allQueries.map((query) => ({
        data: query.state.data,
        // dataUpdateCount: query.state.dataUpdateCount,
        // dataUpdatedAt: query.state.dataUpdatedAt,
        error: query.state.error,
        // errorUpdateCount: query.state.errorUpdateCount,
        // errorUpdatedAt: query.state.errorUpdatedAt,
        // fetchFailureCount: query.state.fetchFailureCount,
        fetchFailureReason: query.state.fetchFailureReason,
        fetchMeta: query.state.fetchMeta,
        fetchStatus: query.state.fetchStatus,
        isInvalidated: query.state.isInvalidated,
        status: query.state.status,
      }));
      // Check if the specific parts of the state of any query have changed using deep comparison
      if (!deepEqual(prevDataRef.current, currentDataStates)) {
        // add observersCount and isQueryStale to response as they're functions the server dashboard client can't call
        const newAllQueries = allQueries.map((query: Query) => {
          return {
            ...query,
            observersCount: query.getObserversCount(),
            isQueryStale: query.isStale(),
          } as ExtendedQuery;
        });
        setQueries(allQueries);
        prevDataRef.current = currentDataStates; // Update the ref for future comparison
        // Broadcast new queries
        client?.sendMessage("allQueries", { queries: newAllQueries });
      }
    };
    // Perform an initial update
    updateQueries();
    // Subscribe to the query cache to run updates on changes
    const unsubscribe = queryClient.getQueryCache().subscribe(updateQueries);

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    client?.sendMessage("allQueries", { queries });
  }, [isConnected]);

  return {
    queries,
    isConnected,
    setQueries,
  };
}
