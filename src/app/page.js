"use client";

import { useEffect, useState } from "react";
import { useLazyGetSummaryQuery } from "./Redux/createApi";

export default function Home() {
  const [allArticle, setAllArticle] = useState();

  const [article, setArticle] = useState({
    url: "",
    summary: "",
  });

  useEffect(() => {
    const getArticle = JSON.parse(localStorage.getItem("articles")) || [];

    setAllArticle(getArticle);
  }, []);

  const [getSummary, { error, isFetching }] = useLazyGetSummaryQuery();

  const submit = async (e) => {
    e.preventDefault();

    const exsistingArticle = allArticle.find((item) => {
      return item.url == article.url;
    });

    if (exsistingArticle) {
      setArticle(exsistingArticle);
    }
    const { data } = await getSummary({ articleUrl: article.url });

    const newArticle = { ...article, summary: data.summary };
    const updateArticles = [newArticle, ...allArticle];
    if (data?.summary) {
      setArticle(newArticle);
      setAllArticle(updateArticles);

      localStorage.setItem("articles", JSON.stringify(updateArticles));
    }
  };

  console.log(article, "article");
  console.log(allArticle, "alll");
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <form>
          <input
            type="url"
            placeholder="Enter a URL"
            value={article.url} // Make sure to bind the input value to the state
            onChange={(e) => setArticle({ ...article, url: e.target.value })}
            required
            className="url_input peer-focus:border-gray-700 peer-focus:text-gray-700"
          />

          <button onClick={submit}>submit</button>
        </form>
      </main>
    </div>
  );
}
