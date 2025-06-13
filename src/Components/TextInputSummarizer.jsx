"use client";

import { useLazyGetSummaryQuery } from "@/app/Redux/createApi";
import React, { useEffect, useRef, useState } from "react";
import "./TextInputSummarizer.css";
function TextInputSummarizer() {
  const [allArticle, setAllArticle] = useState([]);

  const [article, setArticle] = useState({
    url: "",
    summary: "",
  });

  const helloRef = useRef();
  const inputRef = useRef();
  const historyRef = useRef();
  useEffect(() => {
    const getArticle = JSON.parse(localStorage.getItem("articles")) || [];

    setAllArticle(getArticle);
    console.log(inputRef.current, "rref");

    const helloInterval = function hello__function() {
      helloRef.current.style.display = "none";
      helloRef.current.classList.add("hello");
      inputRef.current.classList.remove("hidden");
      inputRef.current.classList.add("drag_drop_modal", "flex");
      historyRef.current.classList.remove("hidden");
      historyRef.current.classList.add("drag_drop_modal","flex");
    };
    setInterval(helloInterval, 5500);

    return () => {
      clearInterval(helloInterval);
    };
  }, []);

  const [getSummary, { error, isFetching }] = useLazyGetSummaryQuery();

  const submit = async (e) => {
    e.preventDefault();

    const exsistingArticle = allArticle.find((item) => {
      return item.url == article.url;
    });

    if (exsistingArticle) {
      setArticle(exsistingArticle);
    } else {
      const { data } = await getSummary({ articleUrl: article.url });
      if (data?.summary) {
        const newArticle = { ...article, summary: data.summary };
        const updateArticles = [newArticle, ...allArticle];

        setArticle(newArticle);
        setAllArticle(updateArticles);

        localStorage.setItem("articles", JSON.stringify(updateArticles));
      }
    }
  };

  function historyButton(e, index, item) {
    if (e.target.value == index) {
      setArticle((prev) => {
        return { ...prev, summary: item.summary };
      });
    }
  }

  return (
    <div className="input-div flex flex-col justify-center items-center gap-6">
      <div className="new__bg w-[100%]" ref={helloRef}>
        <div className="hello__div">
          <svg className="hello__svg" viewBox="0 0 1230.94 414.57">
            <path
              d="M-293.58-104.62S-103.61-205.49-60-366.25c9.13-32.45,9-58.31,0-74-10.72-18.82-49.69-33.21-75.55,31.94-27.82,70.11-52.22,377.24-44.11,322.48s34-176.24,99.89-183.19c37.66-4,49.55,23.58,52.83,47.92a117.06,117.06,0,0,1-3,45.32c-7.17,27.28-20.47,97.67,33.51,96.86,66.93-1,131.91-53.89,159.55-84.49,31.1-36.17,31.1-70.64,19.27-90.25-16.74-29.92-69.47-33-92.79,16.73C62.78-179.86,98.7-93.8,159-81.63S302.7-99.55,393.3-269.92c29.86-58.16,52.85-114.71,46.14-150.08-7.44-39.21-59.74-54.5-92.87-8.7-47,65-61.78,266.62-34.74,308.53S416.62-58,481.52-130.31s133.2-188.56,146.54-256.23c14-71.15-56.94-94.64-88.4-47.32C500.53-375,467.58-229.49,503.3-127a73.73,73.73,0,0,0,23.43,33.67c25.49,20.23,55.1,16,77.46,6.32a111.25,111.25,0,0,0,30.44-19.87c37.73-34.23,29-36.71,64.58-127.53C724-284.3,785-298.63,821-259.13a71,71,0,0,1,13.69,22.56c17.68,46,6.81,80-6.81,107.89-12,24.62-34.56,42.72-61.45,47.91-23.06,4.45-48.37-.35-66.48-24.27a78.88,78.88,0,0,1-12.66-25.8c-14.75-51,4.14-88.76,11-101.41,6.18-11.39,37.26-69.61,103.42-42.24,55.71,23.05,100.66-23.31,100.66-23.31"
              transform="translate(311.08 476.02)"
              style={{
                fill: "none",
                stroke: "#fff",
                strokeLinecap: "round",
                strokeMiterLimit: "10",
                strokeWidth: "35px",
              }}
            />
          </svg>
        </div>
      </div>
      <form
        ref={inputRef}
        className="form w-[70%] background-glass p-3  justify-center items-center hidden    "
      >
        <input
          type="url"
          placeholder="Enter a URL"
          value={article.url}
          onChange={(e) => setArticle({ ...article, url: e.target.value })}
          required
          className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[80%] background"
        />

        <button
          disabled={isFetching}
          className="submit-btn w-[20%] bg-white p-3 rounded-3xl cursor-pointer "
          onClick={submit}
        >
          {isFetching ? " Summarizing.." : "Submit"}
        </button>
      </form>

      <div
        ref={historyRef}
        className="hsitory-div hidden gap-3 w-[70%] overflow-x-auto  "
      >
        {allArticle.map((item, index) => {
          return (
            <button
              className="background-glass
            px-4 py-2 rounded-3xl"
              onClick={(e) => {
                historyButton(e, index, item);
              }}
              value={index}
            >
              {item.url.slice(0, 21) + "..."}
            </button>
          );
        })}
      </div>
      {article.summary != "" && (
        <div className="summaryText background-glass w-[70%]">
          <p>{article.summary}</p>
        </div>
      )}
    </div>
  );
}

export default TextInputSummarizer;
