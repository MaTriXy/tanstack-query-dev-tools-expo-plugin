import type {
  DefaultError,
  MutationKey,
  MutationMeta,
  MutationOptions,
  MutationScope,
  QueryKey,
  QueryMeta,
  QueryOptions,
  Query,
  QueryClient,
  QueryState,
  Mutation,
  MutationState,
} from "@tanstack/react-query";

type TransformerFn = (data: any) => any;
function defaultTransformerFn(data: any): any {
  return data;
}

export function customHydrate(
  client: QueryClient,
  dehydratedState: unknown,
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const mutations = (dehydratedState as DehydratedState).mutations || [];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const queries = (dehydratedState as DehydratedState).queries || [];

  // Clear all mutations before hydrating
  // mutationCache.clear();

  mutations.forEach(({ state, ...mutationOptions }) => {
    mutationCache.build(
      client,
      {
        ...client.getDefaultOptions().hydrate?.mutations,
        ...options?.defaultOptions?.mutations,
        ...mutationOptions,
      },
      state
    );
  });

  queries.forEach(({ queryKey, state, queryHash, meta, promise }) => {
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

    if (promise) {
      // Note: `Promise.resolve` required cause
      // RSC transformed promises are not thenable
      const initialPromise = Promise.resolve(promise).then(deserializeData);

      // this doesn't actually fetch - it just creates a retryer
      // which will re-use the passed `initialPromise`
      void query.fetch(undefined, { initialPromise });
    }
  });
}
export function customerDehydrate(client: QueryClient): DehydratedState {
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

interface DehydratedQuery {
  queryHash: string;
  queryKey: QueryKey;
  state: QueryState;
  promise?: Promise<unknown>;
  meta?: QueryMeta;
}

export interface DehydratedState {
  mutations: DehydratedMutation[];
  queries: DehydratedQuery[];
}
interface DehydratedMutation {
  mutationId: number;
  mutationKey?: MutationKey;
  state: MutationState;
  meta?: MutationMeta;
  scope?: MutationScope;
}
// FUNCTIONS

function dehydrateMutation(mutation: Mutation): DehydratedMutation {
  return {
    mutationId: mutation.mutationId,
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
    ...(mutation.options.scope && { scope: mutation.options.scope }),
    ...(mutation.meta && { meta: mutation.meta }),
  };
}

// Most config is not dehydrated but instead meant to configure again when
// consuming the de/rehydrated data, typically with useQuery on the client.
// Sometimes it might make sense to prefetch data on the server and include
// in the html-payload, but not consume it on the initial render.
function dehydrateQuery(query: Query): DehydratedQuery {
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
  };
}
