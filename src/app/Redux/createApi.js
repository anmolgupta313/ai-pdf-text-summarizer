import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const summaryApi = createApi({
  reducerPath: "summaryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://article-extractor-and-summarizer.p.rapidapi.com/",
  }),
  prepareHeaders: (headers) => {
    headers.set("X-RapidAPI-Key", process.env.RAPID_API_KEY);
    headers.set(
      "X-RapidAPI-Host",
      "article-extractor-and-summarizer.p.rapidapi.com"
    );

    return headers;
  },
  endpoints: (build) => ({
    getSummary: build.query({
      query: (query) =>
        `/summarize?url=${encodeURIComponent(
          query.articleUrl
        )}&length=3&lang=en&engine=2`,
    }),
  }),
});

export const { useGetSummary } = summaryApi;
