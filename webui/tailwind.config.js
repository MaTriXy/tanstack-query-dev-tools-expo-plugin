/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        fresh: "#A6F4C5",
        stale: "#FEDF89",
        fetching: "#B2DDFF",
        paused: "#D9D6FE",
        noObserver: "#eaecf0", //  !query.getObserversCount()
        textFresh: "#027A48",
        textStale: "#B54708", //
        textFetching: "#175CD3",
        textPaused: "#5925DC",
        textNoObserver: "#344054", //  !query.getObserversCount()
        borderFresh: "#32D583",
        borderStale: "#FDB022", //
        borderFetching: "#53B1FD",
        borderPaused: "#9B8AFB",
        borderNoObserver: "#344054", //  !query.getObserversCount()
        queryDetailsbgFresh: "#D1FADF",
        queryDetailsbgStale: "#FEF0C7", //
        queryDetailsbgFetching: "#D1E9FF",
        queryDetailsbgPaused: "#EBE9FE",
        queryDetailsbgNoObserver: "#f2f4f7", //  !query.getObserversCount()
        btnRefetch: "#1570EF", //
        btnInvalidate: "#DC6803",
        btnReset: "#475467", //
        btnRemove: "#db2777",
        btnTriggerLoading: "#0891b2",
        btnTriggerLoadiError: "#ef4444", //  !query.getObserversCount()
      },
    },
  },
  plugins: [],
};
