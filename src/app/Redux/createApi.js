import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const summaryApi = createApi({
  reducerPath: "summaryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://article-extractor-and-summarizer.p.rapidapi.com/",
    prepareHeaders: (headers) => {
      headers.set(
        "X-RapidAPI-Key",
        "66214e58cfmsh2a6c7e304eda1fap1a6507jsn69bb7c954a11"
      );
      headers.set(
        "X-RapidAPI-Host",
        "article-extractor-and-summarizer.p.rapidapi.com"
      );

      return headers;
    },
  }),

  endpoints: (build) => ({
    getSummary: build.query({
      query: (query) =>
        `/summarize?url=${encodeURIComponent(
          query.articleUrl
        )}&length=3&lang=en&engine=2`,
    }),
  }),
});

export const { useLazyGetSummaryQuery } = summaryApi;
