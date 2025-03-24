<h1 align="center">Tanstack Query DevTools Expo Plugin</h1>



<br />

Bring the power of [Tanstack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools) to your Expo and React Native applications. Monitor, debug, and manipulate your queries in real-time across all your devices.

## Features

✅ **Full DevTools Experience**: Access all the features from React Query DevTools in your Expo/React Native app  
✅ **Multi-Device Support**: Connect and monitor multiple devices simultaneously  
✅ **Device Selection**: Easily switch between connected devices or target all at once  
✅ **Device Information**: View detailed device info for all connected devices  
✅ **Query Management**: Monitor and interact with all your queries in real-time  
✅ **Query Manipulation**: Refetch, invalidate, reset, and modify query data on the fly  
✅ **Network Simulation**: Toggle device online/offline states to test network resilience  
✅ **Error Simulation**: Trigger error states to test error handling  
✅ **Loading Simulation**: Trigger loading states to test loading UIs  
✅ **Cross-Platform**: Works on iOS, Android and web Expo apps  
✅ **Compatible**: Supports both React Query v4 and v5

![actions](https://github.com/user-attachments/assets/dcedd904-c32a-4931-8fab-30bf9fb1cf1a)
![ui dev tools](https://github.com/user-attachments/assets/b1ad1a3f-f30f-436e-a51d-c32b71db0b8c)

## Installation

```bash
npm install tanstack-query-dev-tools-expo-plugin --save-dev
```

## Compatibility

This plugin supports both Tanstack Query v4 and v5, utilizing APIs that have remained stable across these versions.

### Requirements

#### Peer Dependencies

- `@tanstack/react-query`: ^4.0.0 || ^5.0.0
- `expo`: Any version

## Usage

Simply import and use the `useSyncQueries` hook in your app:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncQueries } from 'tanstack-query-dev-tools-expo-plugin';

const queryClient = new QueryClient();

export function App() {
  // Initialize the dev tools
  useSyncQueries({ queryClient });

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```
## Press Shift + M in your terminal to show your expo dev tools and select `Open tanstack-query-dev-tools-expo-plugin`
![image](https://github.com/user-attachments/assets/cfa225f2-a222-4bfa-abc8-7038ec3616f8)

## Example app
https://github.com/LovesWorking/RN-Dev-Tools-Example

## DevTools Capabilities

### Monitoring Queries

- View active, inactive, and stale queries
- Inspect query data, status, and metadata
- Track query updates in real-time

### Query Manipulation

- Manually trigger refetches
- Invalidate queries to force refetches
- Reset query cache entries
- Modify query data directly

### Debugging Tools

- Simulate error states
- Simulate loading states
- Toggle network connectivity
- View detailed query timings

### Device Management

- Connect multiple devices simultaneously
- View detailed device information
- Target specific devices for actions
- Apply changes across all connected devices


## License

MIT

## Author

[LovesWorking](https://github.com/LovesWorking)

## Repository

[GitHub Repository](https://github.com/LovesWorking/tanstack-query-dev-tools-expo-plugin)
