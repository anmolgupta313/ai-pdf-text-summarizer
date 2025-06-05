import { configureStore } from "@reduxjs/toolkit";
import { summaryApi } from "./createApi";
// Create the store instance directly and export it
const store = configureStore({
  reducer: {
    [summaryApi.reducerPath]: summaryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(summaryApi.middleware),
});

export default store;
