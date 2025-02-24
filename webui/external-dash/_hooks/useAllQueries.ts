import { useEffect, useState } from "react";
import { useQueryClient, Query } from "@tanstack/react-query";
import { deepEqual } from "fast-equals";

function useAllQueries(): Query[] {
  const queryClient = useQueryClient();
  const [queries, setQueries] = useState<Query[]>([]);
  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient.getQueryCache().findAll();
      // Only update if the queries have changed with deepEqual to avoid infinite loop
      if (!deepEqual(allQueries, queries)) {
        setQueries(allQueries);
      }
    };
    updateQueries();
    const unsubscribe = queryClient.getQueryCache().subscribe(updateQueries);
    return () => unsubscribe();
  }, [queryClient, setQueries, queries]);
  return queries;
}
export default useAllQueries;
