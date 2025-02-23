export let useQueryDevTools;
// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== 'production') {
    useQueryDevTools = require('./useQueryDevTools').useQueryDevTools;
}
else {
    useQueryDevTools = () => { };
}
//# sourceMappingURL=index.js.map