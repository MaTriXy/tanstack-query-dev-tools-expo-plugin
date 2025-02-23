import { useDevToolsPluginClient } from 'expo/devtools';
import { useEffect } from 'react';
export function useQueryDevTools() {
    const client = useDevToolsPluginClient('tanstack-query-dev-tools-expo-plugin');
    useEffect(() => {
        const subscriptions = [];
        subscriptions.push(client?.addMessageListener('ping', (data) => {
            alert(`Received ping from ${data.from}`);
        }));
        client?.sendMessage('ping', { from: 'app' });
        return () => {
            for (const subscription of subscriptions) {
                subscription?.remove();
            }
        };
    }, [client]);
}
//# sourceMappingURL=useQueryDevTools.js.map