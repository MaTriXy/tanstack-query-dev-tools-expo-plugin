# tanstack-query-dev-tools-expo-plugin

Tanstack Query DevTools for Expo

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/tanstack-query-dev-tools-plugin/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/tanstack-query-dev-tools-plugin/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install tanstack-query-dev-tools-expo-plugin
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

expo start --web (defaults to development mode)
expo start --web --no-dev (sets to production mode)

npm run web:dev
npm all
npx serve dist

React Query clone

# Terminal 1 - in query-devtools

cd /Users/aj/Desktop/react-query-clone/packages/query-devtools
pnpm build:dev & (while true; do yalc push --changed; sleep 2; done)

# Terminal 2 - in react-query-devtools

cd /Users/aj/Desktop/react-query-clone/packages/react-query-devtools
pnpm build:dev & (while true; do yalc push --changed; sleep 2; done)

This app -
yalc add @tanstack/query-devtools --watch
yalc add @tanstack/react-query-devtools --watch
