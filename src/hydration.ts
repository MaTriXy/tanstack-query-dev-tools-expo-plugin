import type {
  DefaultError,
  MutationOptions,
  QueryOptions,
  Query,
  QueryClient,
  Mutation,
} from "@tanstack/react-query";
import { QueryObserver } from "@tanstack/react-query";

import {
  DehydratedMutation,
  DehydratedQuery,
  DehydratedState,
  ObserverState,
} from "./types";
type TransformerFn = (data: any) => any;
function defaultTransformerFn(data: any): any {
  return data;
}

export function Hydrate(
  client: QueryClient,
  dehydratedState: DehydratedState,
  options?: HydrateOptions
): void {
  if (typeof dehydratedState !== "object" || dehydratedState === null) {
    console.log("dehydratedState is not an object or null");
    return;
  }
  const queryCache = client.getQueryCache();
  const mutationCache = client.getMutationCache();
  const deserializeData =
    options?.defaultOptions?.deserializeData ?? defaultTransformerFn;

  const dehydratedMutations = dehydratedState.mutations || [];
  const dehydratedQueries = dehydratedState.queries || [];

  // Sync mutations
  dehydratedMutations.forEach(({ state, ...mutationOptions }) => {
    const existingMutation = mutationCache
      .getAll()
      .find((mutation) => mutation.mutationId === mutationOptions.mutationId);

    if (existingMutation) {
      existingMutation.state = state;
    } else {
      mutationCache.build(
        client,
        {
          ...client.getDefaultOptions().hydrate?.mutations,
          ...options?.defaultOptions?.mutations,
          ...mutationOptions,
        },
        state
      );
    }
  });
  // Hydrate queries
  dehydratedQueries.forEach(
    ({ queryKey, state, queryHash, meta, promise, observers }) => {
      let query = queryCache.get(queryHash);
      const data =
        state.data === undefined ? state.data : deserializeData(state.data);
      // Do not hydrate if an existing query exists with newer data
      if (query) {
        if (
          query.state.dataUpdatedAt < state.dataUpdatedAt ||
          query.state.fetchStatus !== state.fetchStatus
        ) {
          query.setState({
            ...state,
            data,
          });
        }
      } else {
        // Restore query
        query = queryCache.build(
          client,
          {
            ...client.getDefaultOptions().hydrate?.queries,
            ...options?.defaultOptions?.queries,
            queryKey,
            queryHash,
            meta,
          },
          {
            ...state,
            data,
          }
        );
      }
      cleanUpObservers(query);
      recreateObserver(client, observers, query);
      if (promise) {
        // Note: `Promise.resolve` required cause
        // RSC transformed promises are not thenable
        const initialPromise = Promise.resolve(promise).then(deserializeData);

        // this doesn't actually fetch - it just creates a retryer
        // which will re-use the passed `initialPromise`
        void query.fetch(undefined, { initialPromise });
      }
    }
  );
  // @ts-expect-error - Refresh mutation state
  mutationCache.notify({ type: "observerResultsUpdated" });
}
// Clean up existing observers
function cleanUpObservers(query: Query) {
  const observers = query.observers;
  observers.forEach((observer) => {
    query.removeObserver(observer);
  });
}

function recreateObserver(
  queryClient: QueryClient,
  observers: ObserverState[],
  query: Query
) {
  observers.forEach((observerState) => {
    const observer = new QueryObserver(queryClient, observerState.options);
    query.addObserver(observer);
  });
}

export function Dehydrate(client: QueryClient): DehydratedState {
  const mutations = client
    .getMutationCache()
    .getAll()
    .flatMap((mutation) => [dehydrateMutation(mutation)]);

  const queries = client
    .getQueryCache()
    .getAll()
    .flatMap((query) => [dehydrateQuery(query)]);

  return { mutations, queries };
}
export interface DehydrateOptions {
  serializeData?: TransformerFn;
  shouldDehydrateMutation?: (mutation: Mutation) => boolean;
  shouldDehydrateQuery?: (query: Query) => boolean;
  shouldRedactErrors?: (error: unknown) => boolean;
}

export interface HydrateOptions {
  defaultOptions?: {
    deserializeData?: TransformerFn;
    queries?: QueryOptions;
    mutations?: MutationOptions<unknown, DefaultError, unknown, unknown>;
  };
}

function dehydrateMutation(mutation: Mutation): DehydratedMutation {
  return {
    mutationId: mutation.mutationId,
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
    ...(mutation.options.scope && { scope: mutation.options.scope }),
    ...(mutation.meta && { meta: mutation.meta }),
  };
}

function dehydrateQuery(query: Query): DehydratedQuery {
  // Extract observer states
  const observerStates: ObserverState[] = query.observers.map((observer) => ({
    queryHash: query.queryHash,
    options: observer.options,
  }));

  return {
    state: {
      ...query.state,
      ...(query.state.data !== undefined && {
        data: query.state.data,
      }),
    },
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    ...(query.meta && { meta: query.meta }),
    observers: observerStates,
  };
}
