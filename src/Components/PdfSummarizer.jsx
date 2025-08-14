"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Moveable from "react-moveable";

function PdfSummarizer() {
  const [sumamry, setSumamry] = useState("");
  const [pdfData, setPdfDta] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [question, setQuestion] = useState([]);
  const moveableRef = useRef();
  const [rawSumamry, setRawSumamry] = useState("");

  const chatDivRef = useRef(null);
  // const [question, setQuestion] = useState("how many years of experience");

  function onFileChange(e) {
    const file = e.target.files[0];

    const fileReader = new FileReader();
    fileReader.onload = onLoadFile;
    fileReader.readAsArrayBuffer(file);
  }

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };
  function onLoadFile(e) {
    const typedArray = new Uint8Array(e.target.result);

    pdfjsLib
      .getDocument({
        data: typedArray,
      })
      .promise.then((pdf) => {
        pdf.getPage(1).then((page) => {
          page.getTextContent().then((content) => {
            let text = "";
            content.items.forEach((item) => {
              text += item.str + "";
            });
            setPdfDta(text);
            sendData(text);
          });
        });
      });
  }

  const systemPrompt = `
You are a document parsera and sumarizer. Your job is to sumarize and break the input text into semantically meaningful sections based on content and structure. 

Return the result in JSON with the following format:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Cleaned up content of this section"
    }
  ]
}

Only include meaningful content. If it's a resume, detect sections like Contact Info, Summary, Skills, Experience, Projects, Education, etc.
If it's a report or article, detect sections like Introduction, Methodology, Findings, Conclusion, etc.
Do not make up information.
`;

  function sendData(text) {
    setRawSumamry(text);
    fetch("/Api/Summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: systemPrompt,
        text: text,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const jsonStartIndex = data.sumamry.indexOf("{");
        const jsonEndIndex = data.sumamry.lastIndexOf("}") + 1;

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const jsonString = data.sumamry.substring(
            jsonStartIndex,
            jsonEndIndex
          );
          try {
            const extractedObject = JSON.parse(jsonString);
            setSumamry(extractedObject);
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      });
  }

  function chat(e) {
    e.preventDefault();
    const newQuestion = {
      id: question.length + 1,
      question: inputValue,
      answer: "", // placeholder until we get the answer
    };

    setQuestion((prev) => [...prev, newQuestion]);

    const currentQuestionId = newQuestion.id;

    fetch("/Api/Query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: inputValue,
        rawSumamry,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setQuestion((prev) =>
          prev.map((q) =>
            q.id === currentQuestionId ? { ...q, answer: data.answer } : q
          )
        );

        setInputValue("");

        console.log(data, "questiondata");
      });

    setInputValue("");
  }
  // useEffect(() => {
  //   if (chatDivRef.current) {
  //     console.log(chatDivRef.current, "chatDivRef element");
  //     chatDivRef.current.scrollTo({
  //       top: chatDivRef.current.scrollHeight,
  //       behavior: "smooth",
  //     });
  //   }
  // }, [question]);
  console.log(question, "ques");

  return (
    <div className="flex flex-col gap-5 ">
      <div className="flex justify-center flex-col items-center">
        <div>
          <p>PDF Upload</p>
          <input
            type="file"
            accept=".pdf"
            name="file"
            id="file"
            onChange={onFileChange}
            className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[80%] background"
          />
        </div>
      </div>

      <div className="flex gap-5 max-h-[50%]">
        {sumamry != "" && (
          <div className="flex justify-center items-start gap-6 w-full max-h-[600px]">
            <div className="summaryText background-glass max-w-[60%] max-h-[85%] overflow-auto ">
              {sumamry?.sections?.map((section, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {section.title}
                  </h3>
                  {section.content.split("\n").map((line, i) => (
                    <p key={i} className="text-sm mb-1">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div
              className="flex gap-3 flex-col max-w-[30%] max-h-[85%] h-[100%] justify-end"
              ref={moveableRef}
            >
              {question.length > 0 && (
                <div
                  className="form w-full px-5 py-3 justify-start items-center flex flex-col gap-5 overflow-y-auto max-h-[600px]"
                  ref={chatDivRef}
                >
                  {question?.map((question) => {
                    return (
                      <>
                        <div className="background-glass px-5 py-3 rounded-xl flex w-[100%] justify-between ">
                          {" "}
                          <div className="w-[50%] text-start ml-4 py-2">
                            <p
                              className={
                                question.answer == ""
                                  ? "answering-text"
                                  : "answertext"
                              }
                            >
                              <ReactMarkdown>
                                {question.answer == ""
                                  ? "answering"
                                  : question.answer}
                              </ReactMarkdown>
                            </p>
                          </div>
                          <div className="w-[50%] text-end mr-4 py-2">
                            <p>{question.question}</p>
                          </div>
                        </div>
                      </>
                    );
                  })}
                </div>
              )}
              <form
                className="form w-[100%] background-glass p-3  justify-center items-center "
                onSubmit={chat}
              >
                <input
                  placeholder="Talk with your PDF"
                  id="question"
                  type="text"
                  value={inputValue}
                  onChange={handleChange}
                  className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[80%] background"
                />{" "}
                <button
                  value={question?.map((value) => {
                    return value?.id;
                  })}
                  className="submit-btn w-[18%] bg-white p-1 rounded-2xl cursor-pointer "
                  type="submit"
                >
                  Send{" "}
                </button>
              </form>

              {/* <Moveable
                target={moveableRef.current} // Target using ref
                origin={true}
                edge={false}
                draggable={true}
                throttleDrag={0}
                onDrag={({ target, transform }) => {
                  target.style.transform = transform;
                }}
              /> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfSummarizer;
