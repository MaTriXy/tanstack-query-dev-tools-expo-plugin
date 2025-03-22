// We can not useState or useRef in a server component, which is why we are
// extracting this part out into it's own file with 'use client' on top
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Device from "expo-device";
import { useState } from "react";

import { useSyncQueriesWeb } from "./useSyncQueriesWeb";

interface Props {
  children: React.ReactNode;
  setDevices: React.Dispatch<React.SetStateAction<(typeof Device)[]>>;
}

export default function Providers({ children, setDevices }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            queryFn: async ({ queryKey }) => {
              console.log("queryFn", queryKey);
              // Prevent refetch from throwing an error
              return Promise.resolve(null);
            },
          },
        },
      })
  );

  useSyncQueriesWeb({ queryClient, setDevices });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
