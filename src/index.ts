export let useQueryDevTools: typeof import('./useQueryDevTools').useQueryDevTools;

// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== 'production') {
  useQueryDevTools = require('./useQueryDevTools').useQueryDevTools;
} else {
  useQueryDevTools = () => {};
}
